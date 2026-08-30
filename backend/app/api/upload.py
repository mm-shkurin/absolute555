from fastapi import APIRouter, UploadFile, File, Depends, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
from datetime import datetime
from app.models.sale_car import SaleCars
from app.models.users import Users
from app.db.database import get_db
from app.utils.security import get_current_user
from app.tasks.decode_vin import decode_vin_from_sts_sale_car_task
from app.tasks.status_updater import TaskStatus
from app.permissions.dependencies import require_permission
from app.permissions.guests import check_guest_car_limit, forbid_guest
from app.permissions.permissions import Permission
import uuid
import base64

upload_router = APIRouter()


# Story 1 removed three endpoints from this module: POST /upload/sts, which created a
# personal-garage car from a СТС photo; POST /upload/{car_id}/photos, which appended to a
# `photos_bytes` column the Cars model never declared; and POST
# /upload/sts-with-appointment, the service booking. The last one was already inert — it
# sat inside a module-level triple-quoted string, which is why nobody noticed it called
# an AppointmentService that is defined nowhere in the codebase.


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
