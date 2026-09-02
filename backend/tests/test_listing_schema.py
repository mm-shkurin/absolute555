"""The listing table after the move to the six lifecycle statuses.

Unlike the rest of this suite these tests need a database: what they assert is the
migrated schema itself, which no in-process client can show. They run against whatever
POSTGRES_* the environment points at, which in this project is the compose stack.

They cover scenario inf-01 of story 4 — existing listings survive the move — from the
end state rather than by replaying the migration: the retired status must be gone, the
three wizard columns must accept null, and the two new columns must exist.
"""

import pytest
from sqlalchemy import text

from tests.conftest import test_session

pytestmark = pytest.mark.asyncio


async def _column(name: str) -> dict:
    async with test_session()() as session:
        row = await session.execute(
            text(
                "SELECT is_nullable, column_default FROM information_schema.columns "
                "WHERE table_name = 'sale_cars' AND column_name = :name"
            ),
            {"name": name},
        )
        found = row.mappings().first()
    assert found is not None, f"sale_cars has no column {name}"
    return dict(found)


@pytest.mark.parametrize("name", ["price", "milleage", "phone_number"])
async def test_should_let_a_draft_leave_the_wizard_columns_empty(name):
    # A draft is incomplete by definition — the wizard saves it on every one of its six
    # steps — so completeness is checked on the submit boundary, not by the column.
    assert (await _column(name))["is_nullable"] == "YES"


@pytest.mark.parametrize("name", ["reject_reason", "published_at"])
async def test_should_carry_the_columns_the_lifecycle_needs(name):
    assert (await _column(name))["is_nullable"] == "YES"


async def test_should_start_a_new_listing_as_a_draft():
    default = (await _column("status"))["column_default"] or ""
    assert "draft" in default


async def test_should_leave_no_listing_in_a_retired_status():
    async with test_session()() as session:
        result = await session.execute(
            text("SELECT count(*) FROM sale_cars WHERE status = 'on_sale'")
        )
        assert result.scalar_one() == 0


async def test_should_index_status_so_the_baskets_stay_cheap():
    # Every "My listings" basket and the feed itself filter on status.
    async with test_session()() as session:
        result = await session.execute(
            text("SELECT indexname FROM pg_indexes WHERE tablename = 'sale_cars'")
        )
        names = {row[0] for row in result}
    assert "ix_sale_cars_status" in names


@pytest.mark.parametrize("name", ["photos", "sts_key"])
async def test_should_carry_the_columns_the_gallery_needs(name):
    assert (await _column(name)) is not None


async def test_should_start_a_listing_with_an_empty_gallery():
    default = (await _column("photos"))["column_default"] or ""
    assert "[]" in default


async def test_should_leave_no_document_sitting_in_the_listing_row():
    # The scans that were base64 in this table are the reason the closed bucket exists.
    async with test_session()() as session:
        result = await session.execute(
            text("SELECT count(*) FROM sale_cars WHERE sts_key IS NOT NULL AND sts_key LIKE 'data:%'")
        )
        assert result.scalar_one() == 0


async def test_should_have_carried_every_old_photograph_into_the_new_shape():
    # Only rows that predate the migration carry the retired column; everything created
    # since leaves it empty, so comparing every row would compare the wrong ones.
    async with test_session()() as session:
        result = await session.execute(
            text(
                "SELECT count(*) FROM sale_cars "
                "WHERE COALESCE(json_array_length(s3_photo_car_keys), 0) > 0 "
                "  AND jsonb_array_length(COALESCE(photos, '[]'::jsonb)) "
                "      <> json_array_length(s3_photo_car_keys)"
            )
        )
        assert result.scalar_one() == 0
