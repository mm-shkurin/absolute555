from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.database import get_db
from app.models.users import Users
from app.services.car_service import CarService
from app.schemas.cars import CarResponse, CarUpdate, CarUpdateResponse
from app.utils.security import get_current_user
from app.permissions.dependencies import require_permission
from app.permissions.permissions import Permission

cars_router = APIRouter()

@cars_router.get("/cars", response_model=List[CarResponse])
async def get_user_cars(
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(require_permission(Permission.VIEW_SERVICES)),
):
    service = CarService(db)
    cars = await service.get_cars_by_user(str(current_user.id))
    
    enriched_cars = []
    for car in cars:
        car_data = {
            "car_id": car.car_id,
            "user_id": car.user_id,
            "vin": car.vin,
            "chroma_document_id": car.chroma_document_id,
            "task_id": car.task_id,
            "task_status": car.task_status,
            "created_at": car.created_at,
            "updated_at": car.updated_at
        }
        
        if car.chroma_document_id:
            try:
                from app.services.chromadb_service import ChromaService
                chroma = ChromaService()
                chroma_data = await chroma.get_document(car.chroma_document_id)
                if chroma_data and isinstance(chroma_data, dict):
                    car_data.update(chroma_data)
            except Exception as e:
                print(f"Error getting ChromaDB data for car {car.car_id}: {e}")
        
        enriched_cars.append(car_data)
    
    return enriched_cars

@cars_router.get("/cars/{car_id}", response_model=CarResponse)
async def get_car_by_id(
    car_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(require_permission(Permission.VIEW_SERVICES)),
):
    service = CarService(db)
    car = await service.get_car_by_id(car_id)
    
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    
    if car.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    car_data = {
        "car_id": car.car_id,
        "user_id": car.user_id,
        "vin": car.vin,
        "chroma_document_id": car.chroma_document_id,
        "s3_photo_car_keys": getattr(car, "s3_photo_car_keys", None),
        "task_id": getattr(car, "task_id", None),
        "task_status": car.task_status,
        "created_at": car.created_at,
        "updated_at": car.updated_at
    }
    
    if car.chroma_document_id:
        try:
            from app.services.chromadb_service import ChromaService
            chroma = ChromaService()
            chroma_data = await chroma.get_document(car.chroma_document_id)
            if chroma_data and isinstance(chroma_data, dict):
                car_data.update(chroma_data)
        except Exception as e:
            print(f"Error getting ChromaDB data for car {car.car_id}: {e}")
    
    return car_data

@cars_router.put("/cars/{car_id}", response_model=CarUpdateResponse)
async def update_car(
    car_id: str,
    car_update: CarUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(require_permission(Permission.VIEW_SERVICES)),
):

    service = CarService(db)
    
    car = await service.get_car_by_id(car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    
    if car.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {k: v for k, v in car_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    try:
        updated_car = await service.update_car(car_id, update_data)
        
        return CarUpdateResponse(
            car_id=updated_car.car_id,
            user_id=updated_car.user_id,
            vin=updated_car.vin,
            chroma_document_id=updated_car.chroma_document_id,
            task_status=updated_car.task_status,
            updated_at=updated_car.updated_at,
            message="Car updated successfully"
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating car: {str(e)}")

@cars_router.delete("/cars/{car_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_car(
    car_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(require_permission(Permission.VIEW_SERVICES)),
):
    service = CarService(db)
    
    car = await service.get_car_by_id(car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    
    if car.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        await service.delete_car(car_id)
        return None  
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting car: {str(e)}")
