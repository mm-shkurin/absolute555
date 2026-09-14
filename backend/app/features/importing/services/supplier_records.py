from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.importing.models.supplier import SupplierProfile


async def find_profile(db: AsyncSession, user_id: str) -> Optional[SupplierProfile]:
    found = await db.execute(select(SupplierProfile).where(SupplierProfile.user_id == user_id))
    return found.scalar_one_or_none()


async def save_profile(db: AsyncSession, profile: SupplierProfile) -> None:
    await db.commit()
    await db.refresh(profile)
