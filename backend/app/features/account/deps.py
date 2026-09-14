"""Service providers of the account feature: where its routers get services, wired with their collaborators."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.features.account.services.user_service import UserService
from app.features.account.services.role_service import RoleService
from app.features.account.services.role_request_service import RoleRequestService
from app.features.account.services.profile_service import ProfileService
from app.features.account.services.people_service import PeopleService
from app.features.account.services.account_access_service import AccountAccessService


def get_account_access_service(db: AsyncSession = Depends(get_db)) -> AccountAccessService:
    return AccountAccessService(db)


def get_people_service(db: AsyncSession = Depends(get_db)) -> PeopleService:
    return PeopleService(db)


def get_profile_service(db: AsyncSession = Depends(get_db)) -> ProfileService:
    return ProfileService(db)


def get_role_request_service(db: AsyncSession = Depends(get_db)) -> RoleRequestService:
    return RoleRequestService(db)


def get_role_service(db: AsyncSession = Depends(get_db)) -> RoleService:
    return RoleService(db)


def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(db)
