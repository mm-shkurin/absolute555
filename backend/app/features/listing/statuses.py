"""Словарь состояний объявления: чем оно бывает, чем становится и почему его вернули.

Лежит вне четырёх слоёв области, потому что принадлежит всем четырём. Роутеру нужен тот
же набор статусов, что и таблице, и модели, и схеме, — а импорт из `models` заставлял бы
роутер тянуть ORM ради перечисления, которое к хранению отношения не имеет.
"""

from enum import Enum as PyEnum


class AutofillState(str, PyEnum):
    """What the reading of the СТС scan came to, as the seller sees it.

    UNREADABLE and UNDECODED are separate because the remedy differs: the first is fixed
    by a better photograph, the second only by typing the fields in.
    """

    NONE = "none"
    PENDING = "pending"
    UNREADABLE = "unreadable"
    UNDECODED = "undecoded"
    DONE = "done"


class FieldSource(str, PyEnum):
    """Who put the value there. SELLER outranks OCR and is never overwritten by it."""

    OCR = "ocr"
    SELLER = "seller"


class RejectionLabel(str, PyEnum):
    """Why a listing was turned back, from a fixed five.

    An enumeration rather than free text: the text tells one seller what to fix, but only
    a label can answer "what do we reject most often", which is the question that decides
    what the wizard should prevent in the first place.
    """

    PLATE_OR_FACE_VISIBLE = "plate_or_face_visible"
    PHOTOS_OF_ANOTHER_CAR = "photos_of_another_car"
    BAIT_PRICE = "bait_price"
    TOO_FEW_PHOTOS = "too_few_photos"
    CONTACTS_IN_DESCRIPTION = "contacts_in_description"


class ListingKind(str, PyEnum):
    """Машина в наличии или машина под привоз.

    Один словарь состояний и одна лента на оба вида: покупатель ищет машину, а не канал
    поставки, и вторая таблица заставила бы дублировать ленту, модерацию и офферы.
    """

    STOCK = "stock"
    IMPORT = "import"


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
    # published -> rejected is the moderator taking a listing down over complaints
    # (story 9). Not withdrawn: that reads as the seller's own doing, and they would
    # never learn what to correct.
    SaleCarStatus.PUBLISHED: frozenset(
        {SaleCarStatus.WITHDRAWN, SaleCarStatus.SOLD, SaleCarStatus.REJECTED}
    ),
    SaleCarStatus.REJECTED: frozenset({SaleCarStatus.DRAFT}),
    SaleCarStatus.WITHDRAWN: frozenset({SaleCarStatus.MODERATION}),
    SaleCarStatus.SOLD: frozenset({SaleCarStatus.WITHDRAWN}),
}

# What a listing must carry before it can be sent for review. Completeness is checked on
# the draft -> moderation boundary rather than by the columns, because a draft is
# incomplete by definition: the wizard saves it on every one of its six steps.
# Make and model are deliberately absent. A make the catalogue does not know would
# otherwise block the sale outright, which is the opposite of what autofill is for: the
# listing goes up carrying the spelling from the document and simply does not appear
# under that filter until a moderator resolves it.
REQUIRED_TO_SUBMIT: tuple[str, ...] = (
    "price",
    "milleage",
    "phone_number",
    "year",
)

# Машины ещё нет в стране: VIN и СТС требовать не с чего, зато без страны, срока и цены
# под ключ объявление под привоз не говорит покупателю ничего.
REQUIRED_TO_SUBMIT_IMPORT: tuple[str, ...] = (
    "price",
    "phone_number",
    "import_country",
    "delivery_days",
    "turnkey_price",
)

MAX_DRAFTS_PER_USER = 5
