"""Reading the feed's query off the request, and refusing what it cannot honour.

FastAPI validates a model given as a dependency by constructing it, and a model that
raises during construction escapes as a 500 rather than a refusal. So the parameters are
declared here one by one and the model is built inside a guard: the rules stay in the
schema, and breaking one answers 422 like every other bad request.
"""

from typing import List, Optional
from uuid import UUID

from fastapi import Query, Request
from pydantic import ValidationError

from app.core.exceptions import ValidationError as InvalidRequest
from app.schemas.feed import FeedQuery, FeedSort

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
    sort: FeedSort = FeedSort.NEWEST,
    page: int = 1,
    size: int = 20,
) -> FeedQuery:
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

    try:
        return FeedQuery(
            brand_id=brand_id,
            model_id=model_id,
            year_from=year_from,
            year_to=year_to,
            price_from=price_from,
            price_to=price_to,
            mileage_from=mileage_from,
            mileage_to=mileage_to,
            transmission=transmission,
            sort=sort,
            page=page,
            size=size,
        )
    except ValidationError as refusal:
        raise InvalidRequest(
            "the feed cannot be asked that",
            code="FEED_QUERY_INVALID",
            details={"errors": [{"field": _field(error), "message": error["msg"]} for error in refusal.errors()]},
        )


def _field(error: dict) -> str:
    location = error.get("loc") or ()
    return str(location[0]) if location else "query"
