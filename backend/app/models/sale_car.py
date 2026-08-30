from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid
from sqlalchemy import Boolean, Column,Float, DateTime, ForeignKey, Integer,JSON, String, Text, Enum, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from datetime import datetime
from enum import Enum as PyEnum

class SaleCarStatus(str, PyEnum):
    DRAFT = "draft"
    MODERATION = "moderation"
    PUBLISHED = "published"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"
    SOLD = "sold"


# The lifecycle as data rather than as branches. Sixteen of the twenty-four
# status-by-action cells are refusals, and a refusal that is a missing branch looks
# exactly like a refusal that was written -- the table is what makes the absent ones
# visible. Who may perform a transition is the router's question, not this table's.
ALLOWED_TRANSITIONS: dict[str, frozenset[str]] = {
    SaleCarStatus.DRAFT: frozenset({SaleCarStatus.MODERATION}),
    SaleCarStatus.MODERATION: frozenset({SaleCarStatus.PUBLISHED, SaleCarStatus.REJECTED}),
    SaleCarStatus.PUBLISHED: frozenset({SaleCarStatus.WITHDRAWN, SaleCarStatus.SOLD}),
    SaleCarStatus.REJECTED: frozenset({SaleCarStatus.DRAFT}),
    SaleCarStatus.WITHDRAWN: frozenset({SaleCarStatus.MODERATION}),
    SaleCarStatus.SOLD: frozenset({SaleCarStatus.WITHDRAWN}),
}

# What a listing must carry before it can be sent for review. Completeness is checked on
# the draft -> moderation boundary rather than by the columns, because a draft is
# incomplete by definition: the wizard saves it on every one of its six steps.
REQUIRED_TO_SUBMIT: tuple[str, ...] = (
    "price",
    "milleage",
    "phone_number",
    "brand_id",
    "model_id",
    "year",
)

MAX_DRAFTS_PER_USER = 5

class SaleCars(Base):
    __tablename__ = "sale_cars"
    vin = Column(String)
    sale_car_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    task_id = Column(String, nullable=True)
    task_status = Column(String, nullable=True)

    # Make and model resolved against the catalogue, null until they resolve. A make or
    # model the catalogue does not know does not stop a listing — it simply does not
    # appear under that filter until a moderator resolves the spelling (CatalogResolver).
    # Story 1 moved these off ChromaDB, where the row held only a document id and so
    # nothing could filter or sort on them; story 3 turned the two name columns into
    # these keys.
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.brand_id", ondelete="SET NULL"), nullable=True, index=True)
    model_id = Column(UUID(as_uuid=True), ForeignKey("car_models.model_id", ondelete="SET NULL"), nullable=True, index=True)

    # What OCR actually read, kept even when both resolved. Without it a wrong fuzzy
    # match is invisible: the row says Toyota Camry with nothing to say the document
    # said Carina.
    mark_raw = Column(String, nullable=True)
    model_raw = Column(String, nullable=True)

    # The rest of what the СТС yields. Nullable because a listing can be filled in by
    # hand with no document at all, and an import listing has no VIN to decode.
    year = Column(Integer, nullable=True)
    transmission = Column(String, nullable=True)
    engine_power = Column(Integer, nullable=True)

    price = Column(Float, nullable=True)
    milleage = Column(Float, nullable=True)
    phone_number = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String, default=SaleCarStatus.DRAFT, nullable=False, index=True)

    # Set when a moderator rejects, cleared when the listing returns to a draft. A
    # rejection with no reason gives the seller nothing to correct.
    reject_reason = Column(Text, nullable=True)
    published_at = Column(DateTime, nullable=True)
    # The gallery, in the order the seller arranged it. A list of
    # {"photo_id", "key", "preview_key"} -- the list's order *is* the display order, and
    # its first element is the cover. A separate cover column would be a second source of
    # truth, and the two would disagree the first time a reorder half-applied.
    photos = Column(JSONB, default=list)

    # The СТС scan lives in the closed bucket; the row keeps only its key. It used to be
    # base64 in this table, which put a document in every dump and in any SELECT * a
    # developer ran. Cleared once a moderator has decided (story 5).
    sts_key = Column(String, nullable=True)

    brand = relationship("Brand")
    model = relationship("CarModel")
    offers = relationship("Offer", back_populates="sale_car", cascade="all, delete-orphan")

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
