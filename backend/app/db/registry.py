"""Every mapped class in one import.

The tables are one graph across features -- a user has offers, an offer belongs to a
listing, a review belongs to an offer -- and SQLAlchemy configures its mappers only once
every class in that graph has been imported. A feature imported alone would resolve its
own relationships against classes nobody registered. Alembic reads the same module for the
metadata it compares a revision against.
"""

from app.db.database import Base
from app.features.account.models.account_audit import AccountAudit
from app.features.account.models.role_request import RoleRequest
from app.features.account.models.users import Users
from app.features.catalog.models.catalog import (
    Brand,
    BrandAlias,
    CarModel,
    CatalogSuggestion,
    ModelAlias,
)
from app.features.chat.models.chat import Dialog, Message
from app.features.importing.models.request import BuyerRequest, SupplierResponse
from app.features.importing.models.supplier import SupplierProfile
from app.features.listing.models.sale_car import SaleCars
from app.features.listing.models.thickness import ThicknessMeasurement
from app.features.moderation.models.complaint import Complaint
from app.features.offer.models.offer import Offer
from app.features.review.models.review import Review

__all__ = [
    "AccountAudit",
    "Base",
    "Brand",
    "BuyerRequest",
    "BrandAlias",
    "CarModel",
    "CatalogSuggestion",
    "Complaint",
    "Dialog",
    "Message",
    "ModelAlias",
    "Offer",
    "Review",
    "RoleRequest",
    "SaleCars",
    "SupplierProfile",
    "SupplierResponse",
    "ThicknessMeasurement",
    "Users",
]
