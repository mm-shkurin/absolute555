"""Reading the feed's query off the request, and refusing what it cannot honour.

FastAPI validates a model given as a dependency by constructing it, and a model that
raises during construction escapes as a 500 rather than a refusal. So the parameters are
declared here one by one and the model is built inside a guard: the rules stay in the
schema, and breaking one answers 422 like every other bad request.
"""

import inspect
from typing import List, Optional
from uuid import UUID

from fastapi import Query, Request
from pydantic import ValidationError

from app.core.exceptions import ValidationError as InvalidRequest
from app.features.listing.domain.statuses import ListingKind
from app.features.listing.schemas.feed import FeedQuery, FeedSort

KNOWN = set(FeedQuery.model_fields)


async def feed_query(
    request: Request,
    brand_id: Optional[UUID] = None,
    model_id: Optional[UUID] = None,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    price_from: Optional[float] = None,
    price_to: Optional[float] = None,
    mileage_from: Optional[float] = None,
    mileage_to: Optional[float] = None,
    transmission: List[str] = Query(default=[]),
    with_thickness_map: bool = False,
    kind: Optional[ListingKind] = None,
    sort: FeedSort = FeedSort.NEWEST,
    page: int = 1,
    size: int = 20,
) -> FeedQuery:
    _refuse_unknown(request)
    try:
        return FeedQuery(**{name: value for name, value in locals().items() if name in KNOWN})
    except ValidationError as refusal:
        raise InvalidRequest(
            "the feed cannot be asked that",
            code="FEED_QUERY_INVALID",
            details={"errors": [{"field": _field(error), "message": error["msg"]} for error in refusal.errors()]},
        )


_PARAMETERS = set(inspect.signature(feed_query).parameters) - {"request"}
if _PARAMETERS != KNOWN:
    # feed_query hands its own arguments to FeedQuery by name; a parameter the schema
    # lacks, or a field with no parameter, would drop a filter without a word.
    raise RuntimeError(f"feed_query and FeedQuery disagree: {sorted(_PARAMETERS ^ KNOWN)}")


def _field(error: dict) -> str:
    location = error.get("loc") or ()
    return str(location[0]) if location else "query"


def _refuse_unknown(request: Request) -> None:
    unknown = sorted(set(request.query_params) - KNOWN)
    if unknown:
        # Ignoring an unknown filter is the worse answer: the screen would show an
        # unfiltered feed while believing it had filtered, and nobody would learn that
        # the parameter does nothing yet.
        raise InvalidRequest(
            f"unknown filter: {', '.join(unknown)}",
            code="UNKNOWN_FILTER",
            details={"unknown": unknown},
        )
