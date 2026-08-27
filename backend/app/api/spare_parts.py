from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
from app.models.spare_parts import SpareParts
from app.models.users import Users
from app.db.database import get_db
from app.utils.security import get_current_user
from app.tasks.check_spare import check_spare_task
from app.tasks.status_updater import TaskStatus
from app.services.spare_parts_service import SparePartsService
from app.schemas.spare_parts import SparePartsCreate, SparePartsUpdate, SparePartsResponse, SparePartsCreateResponse, SparePartsDetailsResponse
from app.permissions.dependencies import (
    require_permission,
    check_guest_car_limit,
    forbid_guest,
    check_guest_repair_limit,
)
from app.permissions.permissions import Permission

spare_parts_router = APIRouter()

@spare_parts_router.post("/spare-parts/{car_id}", response_model=SparePartsCreateResponse)
async def create_spare_part(
    car_id: str,
    spare_part_data: SparePartsCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(check_guest_repair_limit),
):
    service = SparePartsService(db)
    
    from app.models.cars import Cars
    car_res = await db.execute(select(Cars).where(Cars.car_id == car_id))
    car = car_res.scalar_one_or_none()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    if car.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    spare_part = await service.create_spare_part(
        user_id=current_user.id,
        car_id=UUID(car_id),
        name=spare_part_data.name,
        input_mileage=spare_part_data.mileage_last_replaced,
        mileage_average_value=spare_part_data.mileage_average_value
    )
    
    from app.tasks.check_spare import check_spare_task
    from app.tasks.status_updater import TaskStatus
    
    task = check_spare_task.delay(part_id=str(spare_part.part_id))
    
    spare_part.task_id = task.id
    spare_part.task_status = TaskStatus.PENDING
    await db.commit()
    await db.refresh(spare_part)
    
    spare_part_response = SparePartsResponse.model_validate(spare_part)
    
    return {
        "spare_part": spare_part_response.model_dump(),
        "task_id": task.id,
        "task_status": spare_part.task_status,
        "message": "Spare part created and prediction task started"
    }

@spare_parts_router.put("/spare-parts/{part_id}", response_model=SparePartsResponse)
async def update_spare_part(
    part_id: str,
    update_data: SparePartsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(require_permission(Permission.UPLOAD_FILES)),
):
    service = SparePartsService(db)
    
    spare_part = await service.get_spare_part_by_id(part_id)
    if not spare_part:
        raise HTTPException(status_code=404, detail="Spare part not found")
    if spare_part.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await service.update_spare_part_alternative(
        spare_part_id=part_id,
        input_mileage=update_data.input_mileage,
        mileage_average_value=update_data.mileage_average_value
    )
    
    updated_spare_part = result["spare_part"]
    
    return {
        "part_id": updated_spare_part.part_id,
        "car_id": updated_spare_part.car_id,
        "user_id": updated_spare_part.user_id,
        "name": updated_spare_part.name,
        "mileage_last_replaced": updated_spare_part.mileage_last_replaced,
        "array_mileage": updated_spare_part.array_mileage,
        "mileage_average_value": updated_spare_part.mileage_average_value,
        "chroma_document_id": updated_spare_part.chroma_document_id,
        "task_id": updated_spare_part.task_id,
        "task_status": updated_spare_part.task_status,
        "created_at": updated_spare_part.created_at,
        "updated_at": updated_spare_part.updated_at,
        "latest_mileage": updated_spare_part.latest_mileage,
        "mileage_count": updated_spare_part.mileage_count
    }

@spare_parts_router.get("/spare-parts/car/{car_id}", response_model=List[SparePartsResponse])
async def get_spare_parts_by_car(
    car_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(require_permission(Permission.UPLOAD_FILES)),
):
    service = SparePartsService(db)
    
    from app.models.cars import Cars
    car_res = await db.execute(select(Cars).where(Cars.car_id == car_id))
    car = car_res.scalar_one_or_none()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    if car.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    spare_parts = await service.get_spare_parts_by_car(car_id)
    return spare_parts

@spare_parts_router.get("/spare-parts/", response_model=List[SparePartsResponse])
async def get_user_spare_parts(
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(require_permission(Permission.UPLOAD_FILES)),
):
    service = SparePartsService(db)
    spare_parts = await service.get_spare_parts_by_user(str(current_user.id))
    return spare_parts

@spare_parts_router.get("/spare-parts/{part_id}/details", response_model=SparePartsDetailsResponse)
async def get_spare_part_details(
    part_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(require_permission(Permission.UPLOAD_FILES)),
):
    service = SparePartsService(db)
    
    spare_part = await service.get_spare_part_by_id(part_id)
    if not spare_part:
        raise HTTPException(status_code=404, detail="Spare part not found")
    if spare_part.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    gigachat_data = None
    if spare_part.chroma_document_id:
        try:
            from app.services.chromadb_service import ChromaService
            chroma = ChromaService()
            gigachat_data = await chroma.get_document(spare_part.chroma_document_id)
        except Exception as e:
            print(f"Error getting ChromaDB data: {e}")
    
    mileage_calculations = await service.calculate_mileage_difference(part_id, spare_part.latest_mileage)
    
    return {
        "spare_part": {
            "part_id": spare_part.part_id,
            "car_id": spare_part.car_id,
            "user_id": spare_part.user_id,
            "name": spare_part.name,
            "mileage_last_replaced": spare_part.mileage_last_replaced,
            "array_mileage": spare_part.array_mileage,
            "mileage_average_value": spare_part.mileage_average_value,
            "chroma_document_id": spare_part.chroma_document_id,
            "task_id": spare_part.task_id,
            "task_status": spare_part.task_status,
            "created_at": spare_part.created_at,
            "updated_at": spare_part.updated_at,
            "latest_mileage": spare_part.latest_mileage,
            "mileage_count": spare_part.mileage_count
        },
        "gigachat_prediction": gigachat_data,
        "mileage_calculations": mileage_calculations
    }

@spare_parts_router.delete("/spare-parts/{part_id}")
async def delete_spare_part(
    part_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(require_permission(Permission.UPLOAD_FILES)),
):
    service = SparePartsService(db)
    
    spare_part = await service.get_spare_part_by_id(part_id)
    if not spare_part:
        raise HTTPException(status_code=404, detail="Spare part not found")
    if spare_part.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    success = await service.delete_spare_part(part_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete spare part")
    
    return {"message": "Spare part deleted successfully"}
