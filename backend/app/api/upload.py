from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
from datetime import datetime
from app.models.cars import Cars
from app.models.sale_car import SaleCars
from app.models.users import Users
from app.db.database import get_db
from app.utils.security import get_current_user
from app.tasks.decode_vin import decode_vin_from_sts_task, decode_vin_from_sts_sale_car_task
from app.tasks.status_updater import TaskStatus
from app.permissions.dependencies import (
    require_permission,
    check_guest_car_limit,
    forbid_guest,
    check_guest_repair_limit,
)
from app.permissions.permissions import Permission
import uuid
import base64

upload_router = APIRouter()


@upload_router.post("/upload/sts")
async def upload_sts_create_car_and_decode(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(check_guest_car_limit),
):
    car_id = str(uuid.uuid4())
    file_bytes = await file.read()

    encoded = base64.b64encode(file_bytes).decode("utf-8")

    car = Cars(
        car_id=car_id,
        user_id=current_user.id,
        sts_photos=[encoded],  
        task_status=TaskStatus.PENDING,
    )

    db.add(car)
    await db.commit()
    await db.refresh(car)

    task = decode_vin_from_sts_task.delay(car_id=car_id, file_b64=encoded)
    car.task_id = task.id
    await db.commit()

    return {
        "car_id": car_id,
        "user_id": str(car.user_id),
        "vin": car.vin,
        "task_status": car.task_status,
        "task_id": car.task_id,
    }
    
@upload_router.post("/sale-car/sts")
async def upload_sts_create_sale_car_and_decode(
    file: UploadFile = File(...),
    phone_number: str = Form(...),
    price: float = Form(...),
    milleage: float = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(forbid_guest),
):
    sale_car_id = str(uuid.uuid4())
    file_bytes = await file.read()

    encoded = base64.b64encode(file_bytes).decode("utf-8")

    sale_car = SaleCars(
        sale_car_id=sale_car_id,
        user_id=current_user.id,
        sts_photos=[encoded],  
        task_status=TaskStatus.PENDING,
        phone_number=phone_number,
        price=price,
        milleage=milleage,
    )

    db.add(sale_car)
    await db.commit()
    await db.refresh(sale_car)

    task = decode_vin_from_sts_sale_car_task.delay(sale_car_id=sale_car_id, file_b64=encoded)
    sale_car.task_id = task.id
    await db.commit()

    return {
        "sale_car_id": sale_car_id,
        "user_id": str(sale_car.user_id),
        "vin": sale_car.vin,
        "task_status": sale_car.task_status,
        "task_id": sale_car.task_id,
        "phone_number": sale_car.phone_number,
        "price": sale_car.price,
        "milleage": sale_car.milleage,
    }

@upload_router.post("/upload/{car_id}/photos")
async def upload_car_photos(
    car_id: str,
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(Cars).where(Cars.car_id == car_id))
    car = res.scalar_one_or_none()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")

    if not car.photos_bytes:
        car.photos_bytes = []

    for file in files:
        car.photos_bytes.append(await file.read())

    await db.commit()
    await db.refresh(car)

    return {"photos_count": len(car.photos_bytes)}

"""
@upload_router.post("/upload/sts-with-appointment", response_model=AppointmentWithCarResponse)
async def create_appointment_with_car(
    repairs_id: str = Form(...),
    scheduled_date: str = Form(...),
    scheduled_time: str = Form(...),
    problem_description: str = Form(...),
    phone_number: str = Form(...),
    car_id: str = Form(None),
    file: UploadFile = File(None),  
    db: AsyncSession = Depends(get_db),
    current_user: Users = Depends(require_permission(Permission.UPLOAD_FILES)),
):
    
    appointment_service = AppointmentService(db)
    
    if car_id and not file:
        from sqlalchemy import select
        result = await db.execute(select(Cars).where(Cars.car_id == car_id))
        existing_car = result.scalar_one_or_none()
        
        if not existing_car:
            raise HTTPException(status_code=404, detail="Car not found")
        if existing_car.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        car = existing_car
        task_id = car.task_id
        task_status = car.task_status
        
    elif file and not car_id:
        new_car_id = str(uuid.uuid4())
        file_bytes = await file.read()
        encoded = base64.b64encode(file_bytes).decode("utf-8")

        car = Cars(
            car_id=new_car_id,
            user_id=current_user.id,
            sts_photos=[encoded],
            task_status=TaskStatus.PENDING,
        )

        db.add(car)
        await db.commit()
        await db.refresh(car)

        task = decode_vin_from_sts_task.delay(car_id=new_car_id, file_b64=encoded)
        car.task_id = task.id
        await db.commit()
        
        task_id = task.id
        task_status = car.task_status
        
    else:
        raise HTTPException(
            status_code=400, 
            detail="Either car_id (for existing car) or file (for new car) must be provided, but not both"
        )

    appointment_data = AppointmentCreateWithSTS(
        repairs_id=UUID(repairs_id),
        scheduled_date=scheduled_date,
        scheduled_time=scheduled_time,
        problem_description=problem_description,
        phone_number=phone_number
    )

    appointment = await appointment_service.create_appointment_with_sts(
        user_id=current_user.id,
        appointment_in=appointment_data,
        car_id=car.car_id
    )

    return AppointmentWithCarResponse(
        car_id=car.car_id,
        appointment_id=str(appointment.appointment_id),
        user_id=str(car.user_id),
        vin=car.vin,
        task_status=task_status,
        task_id=task_id,
        scheduled_at=appointment.scheduled_at,
        problem_description=appointment.problem_description,
        phone_number=appointment.phone_number,
    )
"""