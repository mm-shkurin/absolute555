from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from loguru import logger
from app.db.database import get_db
from app.models.users import Users
from app.services.sale_cars_service import SaleCarService
from app.schemas.sale_cars import SaleCarResponse, SaleCarUpdate, SaleCarUpdateResponse, SaleCarPhotoDelete, SaleCarStatus
from app.utils.security import get_current_user
from app.permissions.dependencies import can_manage_sale_car, can_delete_sale_car_photos
from app.services.s3_service import s3_service

sale_car_router = APIRouter()
    
@sale_car_router.get("/list", response_model=List[SaleCarResponse])
async def list_sale_cars(
    status: Optional[SaleCarStatus] = None,
    db: AsyncSession = Depends(get_db),
):
    service = SaleCarService(db)
    if status is None:
        status = SaleCarStatus.PUBLISHED
    cars = await service.get_all_sale_cars(status=status)
    
    enriched_cars = []
    for car in cars:
        car_data = {
            "sale_car_id": car.sale_car_id,
            "user_id": car.user_id,
            "vin": car.vin,
            "brand": car.brand.name_ru if car.brand else None,
            "model": car.model.name if car.model else None,
            "mark_raw": car.mark_raw,
            "model_raw": car.model_raw,
            "year": car.year,
            "transmission": car.transmission,
            "engine_power": car.engine_power,
            "s3_photo_car_keys": car.s3_photo_car_keys,
            "task_id": car.task_id,
            "task_status": car.task_status,
            "phone_number": car.phone_number,
            "price": car.price,
            "milleage": car.milleage,
            "description": car.description,
            "status": car.status,
            "created_at": car.created_at,
            "updated_at": car.updated_at,
        }
        try:
            keys = car.s3_photo_car_keys or []
            if keys:
                car_data["preview_photo_url"] = await s3_service.generate_presigned_url(keys[0])
        except Exception:
            pass
        
        enriched_cars.append(car_data)
    
    return enriched_cars

@sale_car_router.get("/user", response_model=List[SaleCarResponse])
async def list_my_sale_cars(
    status: Optional[SaleCarStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    service = SaleCarService(db)
    cars = await service.get_sale_cars_by_user(str(current_user.id), status=status)
    
    enriched_cars = []
    for car in cars:
        car_data = {
            "sale_car_id": car.sale_car_id,
            "user_id": car.user_id,
            "vin": car.vin,
            "brand": car.brand.name_ru if car.brand else None,
            "model": car.model.name if car.model else None,
            "mark_raw": car.mark_raw,
            "model_raw": car.model_raw,
            "year": car.year,
            "transmission": car.transmission,
            "engine_power": car.engine_power,
            "s3_photo_car_keys": car.s3_photo_car_keys,
            "task_id": car.task_id,
            "task_status": car.task_status,
            "phone_number": car.phone_number,
            "price": car.price,
            "milleage": car.milleage,
            "description": car.description,
            "status": car.status,
            "created_at": car.created_at,
            "updated_at": car.updated_at,
        }
        try:
            keys = car.s3_photo_car_keys or []
            if keys:
                car_data["preview_photo_url"] = await s3_service.generate_presigned_url(keys[0])
        except Exception:
            pass
        
        enriched_cars.append(car_data)
    return enriched_cars

@sale_car_router.get("/{sale_car_id}", response_model=SaleCarResponse)
async def get_sale_car_by_id(
    sale_car_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = SaleCarService(db)
    car = await service.get_sale_car_by_id(sale_car_id)
    
    if not car:
        raise HTTPException(status_code=404, detail="Sale car not found")
    
    car_data = {
        "sale_car_id": car.sale_car_id,
        "user_id": car.user_id,
        "vin": car.vin,
        "brand": car.brand.name_ru if car.brand else None,
        "model": car.model.name if car.model else None,
        "mark_raw": car.mark_raw,
        "model_raw": car.model_raw,
        "year": car.year,
        "transmission": car.transmission,
        "engine_power": car.engine_power,
        "s3_photo_car_keys": car.s3_photo_car_keys,
        "task_id": car.task_id,
        "task_status": car.task_status,
        "phone_number": car.phone_number,
        "price": car.price,
        "milleage": car.milleage,
        "description": car.description,
        "status": car.status,
        "created_at": car.created_at,
        "updated_at": car.updated_at,
    }
    try:
        keys = car.s3_photo_car_keys or []
        if keys:
            car_data["photo_urls"] = [await s3_service.generate_presigned_url(k) for k in keys]
            car_data["preview_photo_url"] = car_data["photo_urls"][0]
    except Exception:
        pass
    
    
    return car_data

@sale_car_router.put("/{sale_car_id}", response_model=SaleCarUpdateResponse)
async def update_sale_car(
    sale_car_id: str,
    sale_car_update: SaleCarUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):

    service = SaleCarService(db)
    
    car = await service.get_sale_car_by_id(sale_car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Sale car not found")
    
    if not await can_manage_sale_car(current_user, str(car.user_id)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {k: v for k, v in sale_car_update.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    try:
        updated_car = await service.update_sale_car(sale_car_id, update_data)
        
        return SaleCarUpdateResponse(
            sale_car_id=updated_car.sale_car_id,
            user_id=updated_car.user_id,
            vin=updated_car.vin,
            brand=updated_car.brand.name_ru if updated_car.brand else None,
            model=updated_car.model.name if updated_car.model else None,
            year=updated_car.year,
            transmission=updated_car.transmission,
            engine_power=updated_car.engine_power,
            task_status=updated_car.task_status,
            updated_at=updated_car.updated_at,
            message="Sale car updated successfully"
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating car: {str(e)}")

@sale_car_router.delete("/{sale_car_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sale_car(
    sale_car_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    service = SaleCarService(db)
    
    car = await service.get_sale_car_by_id(sale_car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Sale car not found")
    
    if not await can_manage_sale_car(current_user, str(car.user_id)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        await service.delete_sale_car(sale_car_id)
        return None
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting car: {str(e)}")


@sale_car_router.post("/{sale_car_id}/photos")
async def add_sale_car_photos(
    sale_car_id: str,
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    service = SaleCarService(db)
    car = await service.get_sale_car_by_id(sale_car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Sale car not found")

    if not await can_manage_sale_car(current_user, str(car.user_id)):
        raise HTTPException(status_code=403, detail="Access denied")

    added_keys: list[str] = []
    for f in files:
        key = await s3_service.upload_file_get_key(car_id=sale_car_id, file=f, folder="sale-photos")
        added_keys.append(key)

    existing = car.s3_photo_car_keys or []
    car.s3_photo_car_keys = existing + added_keys
    await db.commit()

    await service.check_and_send_webhook_if_ready(sale_car_id)

    all_keys = car.s3_photo_car_keys or []
    photo_urls = []
    for k in all_keys:
        try:
            photo_urls.append(await s3_service.generate_presigned_url(k))
        except Exception:
            continue

    preview_url = photo_urls[0] if photo_urls else None

    return {
        "sale_car_id": sale_car_id,
        "added": len(added_keys),
        "total": len(all_keys),
        "preview_photo_url": preview_url,
        "photo_urls": photo_urls,
    }

@sale_car_router.delete("/{sale_car_id}/photos")
async def delete_sale_car_photos(
    sale_car_id: str,
    photo_delete: SaleCarPhotoDelete,
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(get_current_user),
):
    service = SaleCarService(db)
    car = await service.get_sale_car_by_id(sale_car_id)
    if not car:
        raise HTTPException(status_code=404, detail="Sale car not found")

    if not await can_delete_sale_car_photos(current_user, str(car.user_id)):
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        result = await service.delete_sale_car_photos(sale_car_id, photo_delete.photo_keys)
        
        car = await service.get_sale_car_by_id(sale_car_id)
        all_keys = car.s3_photo_car_keys or []
        photo_urls = []
        for k in all_keys:
            try:
                photo_urls.append(await s3_service.generate_presigned_url(k))
            except Exception:
                continue

        preview_url = photo_urls[0] if photo_urls else None

        return {
            "sale_car_id": sale_car_id,
            "deleted": result["deleted"],
            "failed": result.get("failed", []),
            "not_found": result.get("not_found", []),
            "remaining_count": result["remaining_count"],
            "total": len(all_keys),
            "preview_photo_url": preview_url,
            "photo_urls": photo_urls,
            "message": result["message"]
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting photos: {str(e)}")
