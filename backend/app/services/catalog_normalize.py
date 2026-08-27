"""Turning what OCR read into something comparable.

Kept apart from `catalog_service` because it is pure: no session, no I/O, no awaiting.
That is also what makes it the one part of the matching ladder that can be tested
without a database.
"""

import re

# Cyrillic look-alikes only. A full transliteration table would turn `ВАЗ` into `VAZ`,
# which is right, but also `ЛАДА` into `LADA` — and both spellings are in the catalogue
# as aliases already, so the extra mapping buys nothing and risks mangling names that
# are genuinely Russian (`Москвич`, `Волга`).
_CYRILLIC_TO_LATIN = str.maketrans({
    "А": "A", "В": "B", "Е": "E", "К": "K", "М": "M", "Н": "H",
    "О": "O", "Р": "P", "С": "C", "Т": "T", "У": "Y", "Х": "X",
})

_NON_ALNUM = re.compile(r"[^0-9A-ZА-ЯЁ]+")


def normalize(value: str | None) -> str:
    """Fold a make or model spelling to its comparison key.

    Upper-cases, maps Cyrillic look-alikes to Latin, then drops everything that is not a
    letter or a digit — so `Land Cruiser Prado`, `LAND-CRUISER PRADO` and
    `land cruiser  prado` all fold to `LANDCRUISERPRADO`.

    Dropping separators rather than collapsing them to spaces is deliberate: СТС prints
    model names with no consistent separator at all, and OCR adds its own. Keeping the
    separator would make `MARK II`, `MARK-II` and `MARKII` three different keys.
    """
    if not value:
        return ""
    folded = value.strip().upper().replace("Ё", "Е").translate(_CYRILLIC_TO_LATIN)
    return _NON_ALNUM.sub("", folded)


def slugify(value: str) -> str:
    """A stable, readable identifier for a catalogue row.

    Unlike `normalize`, this keeps word boundaries as hyphens — a slug is read by people
    and appears in URLs, where `landcruiserprado` is unreadable.
    """
    folded = value.strip().upper().replace("Ё", "Е").translate(_CYRILLIC_TO_LATIN)
    parts = [p for p in _NON_ALNUM.split(folded) if p]
    return "-".join(parts).lower()
