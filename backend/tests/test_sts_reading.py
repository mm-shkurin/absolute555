"""What the reading of a scan does to a listing, and what it refuses to touch.

Story 6. These run below HTTP because the reading is a background job: the seller sees
its result, never the job. Needs the database and the seeded catalogue; the module skips
when either is missing, because their absence says nothing about these rules.
"""

import uuid

import pytest
import pytest_asyncio
from sqlalchemy import select

from app.models.catalog import Brand, CatalogSuggestion, SuggestionKind, SuggestionStatus
from app.models.sale_car import AutofillState, FieldSource, SaleCars, SaleCarStatus
from app.models.users import Users
from app.services.catalog_normalize import normalize
from app.services.catalog_resolver import CatalogResolver
from app.services.listing_autofill import ListingAutofillService
from tests.conftest import test_session

pytestmark = pytest.mark.asyncio


@pytest_asyncio.fixture
async def db():
    try:
        async with test_session()() as session:
            seeded = await session.execute(select(Brand).limit(1))
            if seeded.scalar_one_or_none() is None:
                pytest.skip("catalogue is empty; run python -m app.data.seed_catalog")
            yield session
    except Exception as exc:  # noqa: BLE001 - any connection failure means "no database"
        pytest.skip(f"no database: {exc}")


async def _listing(db) -> SaleCars:
    owner = Users(id=uuid.uuid4(), device_id=f"reading-{uuid.uuid4()}")
    db.add(owner)
    # Committed before the listing: nothing declares the relationship between the two
    # mappers, so the unit of work is free to order the two inserts the wrong way round.
    await db.commit()

    listing = SaleCars(user_id=owner.id, status=SaleCarStatus.DRAFT)
    db.add(listing)
    await db.commit()
    return listing


async def _spelling(db, kind, brand_id, raw_norm):
    found = await db.execute(
        select(CatalogSuggestion).where(
            CatalogSuggestion.kind == kind.value,
            CatalogSuggestion.brand_id == brand_id,
            CatalogSuggestion.raw_norm == raw_norm,
        )
    )
    return found.scalar_one_or_none()


@pytest.mark.parametrize(
    "task_status,expected",
    [
        ("OcrStarted", AutofillState.PENDING),
        ("OcrFailed", AutofillState.UNREADABLE),
        ("DecodeFailed", AutofillState.UNDECODED),
        ("DecodeSuccess", AutofillState.DONE),
    ],
)
async def test_should_show_the_seller_the_outcome_behind_each_step(db, task_status, expected):
    listing = await _listing(db)

    await ListingAutofillService(db).note_task_status(listing, task_status)

    assert listing.autofill_state == expected.value
    assert listing.autofill_updated_at is not None


async def test_should_leave_the_outcome_alone_on_a_step_that_is_not_one(db):
    listing = await _listing(db)
    await ListingAutofillService(db).note_task_status(listing, "DecodeSuccess")

    await ListingAutofillService(db).note_task_status(listing, "SUCCESS")

    assert listing.autofill_state == AutofillState.DONE.value


async def test_should_keep_the_document_spelling_beside_a_make_it_resolved(db):
    listing = await _listing(db)

    outcome = await CatalogResolver(db).resolve_into(listing, "TOYOTA", "CAMRY")

    assert outcome.brand_id is not None
    assert listing.mark_raw == "TOYOTA"
    assert listing.brand_source == FieldSource.OCR.value


async def test_should_not_stop_a_listing_over_a_make_it_never_heard_of(db):
    listing = await _listing(db)
    spelling = f"MARQUE {uuid.uuid4().hex[:6].upper()}"

    outcome = await CatalogResolver(db).resolve_into(listing, spelling, "SOMETHING")
    await db.commit()

    assert outcome.brand_id is None and outcome.suggested == "brand"
    assert listing.mark_raw == spelling
    assert await _spelling(db, SuggestionKind.BRAND, None, normalize(spelling)) is not None


async def test_should_ask_a_moderator_about_one_spelling_once(db):
    first, second = await _listing(db), await _listing(db)
    spelling = f"MARQUE {uuid.uuid4().hex[:6].upper()}"

    await CatalogResolver(db).resolve_into(first, spelling, None)
    await db.commit()
    await CatalogResolver(db).resolve_into(second, spelling, None)
    await db.commit()

    queued = await db.execute(
        select(CatalogSuggestion).where(CatalogSuggestion.raw_value == spelling)
    )
    assert len(queued.scalars().all()) == 1
    assert second.mark_raw == spelling


async def test_should_leave_what_the_seller_chose_untouched_by_a_later_reading(db):
    listing = await _listing(db)
    await CatalogResolver(db).resolve_into(listing, "TOYOTA", "CAMRY")
    chosen_brand, chosen_model = listing.brand_id, listing.model_id
    await ListingAutofillService(db).claim(listing, {"brand_id": chosen_brand, "model_id": chosen_model})
    await db.commit()

    await CatalogResolver(db).resolve_into(listing, "NISSAN", "SKYLINE")
    await db.commit()

    assert listing.brand_id == chosen_brand
    assert listing.model_id == chosen_model
    assert listing.mark_raw == "NISSAN", "the document spelling is still recorded"


async def test_should_close_a_question_the_seller_has_already_answered(db):
    listing = await _listing(db)
    spelling = f"MARQUE {uuid.uuid4().hex[:6].upper()}"
    await CatalogResolver(db).resolve_into(listing, spelling, None)
    await db.commit()

    brand = (await db.execute(select(Brand).limit(1))).scalar_one()
    await ListingAutofillService(db).claim(listing, {"brand_id": brand.brand_id})
    listing.brand_id = brand.brand_id
    await db.commit()

    queued = await _spelling(db, SuggestionKind.BRAND, None, normalize(spelling))
    assert queued.status == SuggestionStatus.RESOLVED.value


async def test_should_keep_a_question_another_listing_still_needs(db):
    mine, theirs = await _listing(db), await _listing(db)
    spelling = f"MARQUE {uuid.uuid4().hex[:6].upper()}"
    await CatalogResolver(db).resolve_into(mine, spelling, None)
    await CatalogResolver(db).resolve_into(theirs, spelling, None)
    await db.commit()

    brand = (await db.execute(select(Brand).limit(1))).scalar_one()
    await ListingAutofillService(db).claim(mine, {"brand_id": brand.brand_id})
    mine.brand_id = brand.brand_id
    await db.commit()

    queued = await _spelling(db, SuggestionKind.BRAND, None, normalize(spelling))
    assert queued.status == SuggestionStatus.PENDING.value
