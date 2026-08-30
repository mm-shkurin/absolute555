"""The matching ladder against the seeded catalogue.

Needs a database with the catalogue in it, unlike the normalisation tests. Run through
`make test` with the stack up; the whole module skips when Postgres is unreachable
rather than failing, because a missing database says nothing about the ladder.
"""

import pytest
import pytest_asyncio
from sqlalchemy import select

from tests.conftest import test_session
from app.models.catalog import Brand
from app.services.catalog_service import CatalogService

pytestmark = pytest.mark.asyncio


@pytest_asyncio.fixture
async def service():
    try:
        async with test_session()() as db:
            seeded = await db.execute(select(Brand).limit(1))
            if seeded.scalar_one_or_none() is None:
                pytest.skip("catalogue is empty; run python -m app.data.seed_catalog")
            yield CatalogService(db)
    except Exception as exc:  # noqa: BLE001 - any connection failure means "no database"
        pytest.skip(f"no database: {exc}")


async def _brand(service, raw):
    return await service.match_brand(raw)


@pytest.mark.parametrize(
    "spelling,expected_slug,expected_step",
    [
        ("toyota", "toyota", "exact"),
        ("TOYOTA", "toyota", "exact"),
        ("Toyota Motor Corporation", "toyota", "alias"),
        ("ТОЙОТА", "toyota", "alias"),
        ("MERCEDES", "mercedes-benz", "alias"),
        ("MB", "mercedes-benz", "alias"),
        ("VW", "volkswagen", "alias"),
        ("ВАЗ", "lada", "alias"),
    ],
)
async def test_should_resolve_a_known_make(service, spelling, expected_slug, expected_step):
    match = await _brand(service, spelling)
    assert match.value is not None, f"{spelling!r} resolved to nothing"
    assert match.value.slug == expected_slug
    assert match.step == expected_step


@pytest.mark.parametrize("misread", ["TOYOTTA", "TOYATA", "NISSIAN", "HYUNDAL"])
async def test_should_resolve_a_misread_make_by_similarity(service, misread):
    # Single-character OCR damage is what the fuzzy step exists for, and nothing above
    # it would catch these. They score 0.40-0.67 against their target, comfortably above
    # the 0.333 that separates the two most similar distinct makes in the catalogue.
    match = await _brand(service, misread)
    assert match.value is not None, f"{misread!r} resolved to nothing"
    assert match.step == "fuzzy"


async def test_should_refuse_a_make_it_does_not_know(service):
    # The point of the high threshold: an unknown make must come back empty so it
    # reaches a moderator, not be forced onto whichever row scored least badly.
    match = await _brand(service, "KOENIGSEGG")
    assert match.value is None
    assert match.step == "none"


@pytest.mark.parametrize("misread", ["Tiggo 9 Pro", "Land Cruiser 90", "Carina X"])
async def test_should_never_guess_a_model(service, misread):
    """A model spelling resolves exactly or not at all.

    Within one make, distinct models sit closer together than a typo sits to its
    target — tiggo-7-pro to tiggo-8-pro is 0.714, land-cruiser to land-cruiser-80 is
    0.813 — so a fuzzy step would merge real models before it repaired a single misread
    one. These three look like near-misses and must all come back empty for a moderator.
    """
    brand_slug = {"Tiggo 9 Pro": "chery", "Land Cruiser 90": "toyota", "Carina X": "toyota"}[misread]
    brand = await _brand(service, brand_slug)
    match = await service.match_model(brand.value.brand_id, misread)
    assert match.value is None, f"{misread!r} was guessed as {getattr(match.value, 'name', None)!r}"


async def test_should_search_models_only_inside_their_make(service):
    # `Focus` is a Ford model. Asked under Toyota it must not resolve — an unscoped
    # model search is how a Corolla ends up recorded as somebody else's car.
    toyota = await _brand(service, "toyota")
    match = await service.match_model(toyota.value.brand_id, "Focus")
    assert match.value is None


@pytest.mark.parametrize(
    "spelling,expected_slug",
    [
        ("Land Cruiser Prado", "land-cruiser-prado"),
        ("LAND-CRUISER PRADO", "land-cruiser-prado"),
        ("landcruiserprado", "land-cruiser-prado"),
        ("Mark II", "mark-ii"),
        ("MARKII", "mark-ii"),
    ],
)
async def test_should_resolve_a_model_however_it_is_spelled(service, spelling, expected_slug):
    toyota = await _brand(service, "toyota")
    match = await service.match_model(toyota.value.brand_id, spelling)
    assert match.value is not None, f"{spelling!r} resolved to nothing"
    assert match.value.slug == expected_slug


async def test_should_resolve_a_right_hand_drive_model(service):
    # The reason the catalogue is hand-written: the open sources have no Wingroad, and
    # a Siberian marketplace that cannot name one is missing half its feed.
    nissan = await _brand(service, "nissan")
    match = await service.match_model(nissan.value.brand_id, "Wingroad")
    assert match.value is not None
    assert match.value.name == "Wingroad"


@pytest.mark.parametrize("empty", [None, "", "   "])
async def test_should_treat_an_empty_spelling_as_no_match(service, empty):
    match = await _brand(service, empty)
    assert match.value is None
    assert match.step == "none"
