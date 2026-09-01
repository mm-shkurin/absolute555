"""Folding a spelling to its comparison key.

The one part of the matching ladder that needs no database, and the part every other
step depends on: if two spellings of the same car fold to different keys, no amount of
alias or fuzzy work downstream recovers it.
"""

import pytest

from app.features.catalog.services.catalog_normalize import normalize, slugify


@pytest.mark.parametrize(
    "spelling",
    ["Land Cruiser Prado", "LAND-CRUISER PRADO", "land  cruiser prado", "LandCruiserPrado"],
)
def test_should_fold_every_separator_style_to_one_key(spelling):
    # СТС prints model names with no consistent separator and OCR adds its own, so the
    # separator carries no information and must not split the key.
    assert normalize(spelling) == "LANDCRUISERPRADO"


@pytest.mark.parametrize("spelling", ["Mark II", "MARK-II", "markii"])
def test_should_fold_roman_numeral_models(spelling):
    assert normalize(spelling) == "MARKII"


def test_should_map_cyrillic_lookalikes_to_latin():
    # OCR reads Latin letters on a badge as their Cyrillic twins often enough that a
    # Cyrillic-looking TOYOTA has to reach the same key as the Latin one. Only the
    # look-alikes are mapped — a genuinely Russian name like Москвич keeps its letters
    # and is matched by an alias instead.
    assert normalize("ТОУОТА") == normalize("TOYOTA")
    assert normalize("СУВАРУ") == normalize("CYBAPY")
    assert normalize("Москвич") != normalize("MOSKVICH")


def test_should_keep_digits():
    # Half the JDM catalogue is digits: 180SX, 300C, 4Runner, LX 570.
    assert normalize("LX 570") == "LX570"
    assert normalize("180SX") == "180SX"


@pytest.mark.parametrize("empty", [None, "", "   ", "---"])
def test_should_fold_nothing_to_an_empty_key(empty):
    # An empty key is what tells the resolver there is nothing to match and nothing to
    # queue — a spelling of punctuation is not a suggestion worth a moderator's time.
    assert normalize(empty) == ""


def test_should_keep_word_boundaries_in_a_slug():
    # Unlike the comparison key, a slug is read by people and appears in URLs.
    assert slugify("Land Cruiser Prado") == "land-cruiser-prado"
    assert slugify("Mercedes-Benz") == "mercedes-benz"
    assert slugify("LX 570") == "lx-570"


def test_slug_and_key_disagree_on_purpose():
    # Both fold the same spelling, and they must not be used interchangeably: the slug
    # keeps the boundary the key deliberately drops.
    assert slugify("Mark II") == "mark-ii"
    assert normalize("Mark II") == "MARKII"
