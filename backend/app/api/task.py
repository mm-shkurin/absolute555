"""The live stream of a listing's background reading.

Two debug endpoints stood beside this one: POST /task/test-update, which wrote any task
status onto any listing with no authentication at all, and GET /task/test-page, an HTML
harness for it. Story 6 removed both -- the first was a write to a stranger's listing
wearing the word "test".
"""

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.sse.listing_stream import listing_events

task_router = APIRouter()


@task_router.get("/sse/{sale_car_id}")
async def sse_endpoint(sale_car_id: str):
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
