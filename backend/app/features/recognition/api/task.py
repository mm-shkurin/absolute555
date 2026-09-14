"""The live stream of a listing's background reading.

Two debug endpoints stood beside this one: POST /task/test-update, which wrote any task
status onto any listing with no authentication at all, and GET /task/test-page, an HTML
harness for it. Story 6 removed both -- the first was a write to a stranger's listing
wearing the word "test".
"""

from fastapi import APIRouter, Depends
from app.features.listing.services.listing_lifecycle import ListingLifecycleService
from fastapi.responses import StreamingResponse

from app.features.listing.deps import get_listing_lifecycle_service
from app.shared.http.listing_http import owned_listing
from app.shared.realtime.listing_stream import listing_events
from app.utils.security import get_current_user

task_router = APIRouter()


@task_router.get("/sse/{sale_car_id}")
async def sse_endpoint(
    sale_car_id: str,
    listing_lifecycle_service: ListingLifecycleService = Depends(get_listing_lifecycle_service),
    current_user=Depends(get_current_user),
):
    """The reading of one listing's document, to the person it belongs to.

    Ownership is checked, not just authentication: the stream carries what a private
    document was read as, and a listing identifier is in every URL its owner has shared.
    """
    await owned_listing(listing_lifecycle_service, sale_car_id, current_user)

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
