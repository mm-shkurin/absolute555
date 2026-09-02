from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid
from sqlalchemy import Boolean, Column,Float, DateTime, ForeignKey, Integer,JSON, String, Text, Enum, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from datetime import datetime
from enum import Enum as PyEnum

# Словарь состояний живёт отдельно (app/features/listing/statuses.py): он нужен и схеме,
# и роутеру, а те не должны импортировать ORM ради перечисления. Имена продолжают
# читаться отсюда — так их импортируют сервисы, для которых модель и есть их предмет.
from app.features.listing.statuses import (  # noqa: F401
    ALLOWED_TRANSITIONS,
    MAX_DRAFTS_PER_USER,
    REQUIRED_TO_SUBMIT,
    AutofillState,
    FieldSource,
    RejectionLabel,
    SaleCarStatus,
)


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
    reject_label = Column(String, nullable=True)

    # When the seller last sent it for review, and when a moderator last decided. The
    # queue is ordered by the first and the "handled today" tab counts the second; the
    # row's updated_at answers neither, because any edit moves it.
    submitted_at = Column(DateTime, nullable=True)
    moderated_at = Column(DateTime, nullable=True)
    moderated_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
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

    # The outcome of the reading, and who filled the two catalogue fields. task_status is
    # the queue's own vocabulary and changes with the pipeline; this is what the seller
    # is shown, and it survives the connection that first reported it.
    autofill_state = Column(String, default=AutofillState.NONE.value, nullable=False)
    brand_source = Column(String, nullable=True)
    model_source = Column(String, nullable=True)
    autofill_updated_at = Column(DateTime, nullable=True)

    # The seller, for the card: a listing without a name attached is a listing whose
    # counterparty is anonymous, which is the thing this marketplace is against.
    # foreign_keys is required since moderated_by joined the table: two columns point at
    # users, and the seller is the one in user_id.
    owner = relationship("Users", foreign_keys=[user_id])
    brand = relationship("Brand")
    model = relationship("CarModel")
    offers = relationship("Offer", back_populates="sale_car", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="listing", cascade="all, delete-orphan")

    # Карта замеров. selectin, потому что сводку по ней несёт каждая карточка ленты, а
    # ленивая загрузка означала бы двадцать запросов на страницу.
    thickness_measurements = relationship(
        "ThicknessMeasurement",
        back_populates="listing",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
