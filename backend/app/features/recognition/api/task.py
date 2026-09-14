"""The live stream of a listing's background reading.

Two debug endpoints stood beside this one: POST /task/test-update, which wrote any task
status onto any listing with no authentication at all, and GET /task/test-page, an HTML
harness for it. Story 6 removed both -- the first was a write to a stranger's listing
wearing the word "test".
"""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.features.listing.api.listing_http import owned_listing
from app.sse.listing_stream import listing_events
from app.utils.security import get_current_user

task_router = APIRouter()


@task_router.get("/sse/{sale_car_id}")
async def sse_endpoint(
    sale_car_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """The reading of one listing's document, to the person it belongs to.

    Ownership is checked, not just authentication: the stream carries what a private
    document was read as, and a listing identifier is in every URL its owner has shared.
    """
    await owned_listing(db, sale_car_id, current_user)

    return StreamingResponse(
        listing_events(sale_car_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )
