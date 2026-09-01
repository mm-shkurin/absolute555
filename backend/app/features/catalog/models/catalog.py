import uuid
from enum import Enum as PyEnum

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class Brand(Base):
    __tablename__ = "brands"

    brand_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String, nullable=False, unique=True, index=True)
    name_ru = Column(String, nullable=False)
    name_en = Column(String, nullable=False)

    # Lifts a brand to the top of the filter column. An alphabetical list starting at
    # Acura buries Toyota, which is most of the market here.
    is_popular = Column(Boolean, default=False, nullable=False)

    models = relationship("CarModel", back_populates="brand", cascade="all, delete-orphan")
    aliases = relationship("BrandAlias", back_populates="brand", cascade="all, delete-orphan")


class CarModel(Base):
    """Named CarModel, not Model: SQLAlchemy's declarative base and Pydantic both use
    `Model` for their own concepts, and one import away this becomes unreadable."""

    __tablename__ = "car_models"
    __table_args__ = (UniqueConstraint("brand_id", "slug", name="car_models_brand_slug_key"),)

    model_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.brand_id", ondelete="CASCADE"), nullable=False, index=True)
    slug = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)

    brand = relationship("Brand", back_populates="models")
    aliases = relationship("ModelAlias", back_populates="model", cascade="all, delete-orphan")


class BrandAlias(Base):
    """A spelling that resolves to a brand.

    This is what stops a moderator resolving the same OCR spelling forever: approving
    `МЕРСЕДЕС` once writes it here, and the next listing matches on the alias step
    instead of reaching the fuzzy search.
    """

    __tablename__ = "brand_aliases"

    alias_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.brand_id", ondelete="CASCADE"), nullable=False, index=True)
    alias_norm = Column(String, nullable=False, unique=True, index=True)

    brand = relationship("Brand", back_populates="aliases")


class ModelAlias(Base):
    __tablename__ = "model_aliases"
    __table_args__ = (UniqueConstraint("brand_id", "alias_norm", name="model_aliases_brand_alias_key"),)

    alias_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_id = Column(UUID(as_uuid=True), ForeignKey("car_models.model_id", ondelete="CASCADE"), nullable=False, index=True)

    # Denormalised from the model so the alias step can be scoped to a brand in one
    # query. `Focus` exists at three manufacturers; an unscoped alias lookup picks wrong.
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.brand_id", ondelete="CASCADE"), nullable=False, index=True)
    alias_norm = Column(String, nullable=False)

    model = relationship("CarModel", back_populates="aliases")


class SuggestionKind(str, PyEnum):
    BRAND = "brand"
    MODEL = "model"


class SuggestionStatus(str, PyEnum):
    PENDING = "pending"
    RESOLVED = "resolved"
    REJECTED = "rejected"


class CatalogSuggestion(Base):
    """A spelling the ladder could not resolve, queued for a moderator.

    One row per distinct raw value, not per listing: the queue shows
    `Toyota · LC PRADO 150 · 3 объявления`, and resolving it fixes all three at once.
    """

    __tablename__ = "catalog_suggestions"
    __table_args__ = (UniqueConstraint("kind", "brand_id", "raw_norm", name="catalog_suggestions_unique_raw"),)

    suggestion_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kind = Column(String, nullable=False)

    # Set for a model suggestion, null for a brand one — a model spelling only means
    # anything under a known brand.
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.brand_id", ondelete="CASCADE"), nullable=True, index=True)

    raw_value = Column(Text, nullable=False)
    raw_norm = Column(String, nullable=False, index=True)
    status = Column(String, default=SuggestionStatus.PENDING.value, nullable=False, index=True)

    resolved_brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.brand_id", ondelete="SET NULL"), nullable=True)
    resolved_model_id = Column(UUID(as_uuid=True), ForeignKey("car_models.model_id", ondelete="SET NULL"), nullable=True)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
