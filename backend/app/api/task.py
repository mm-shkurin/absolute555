from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from loguru import logger

from app.sse.listing_stream import listing_events

task_router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

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


@task_router.post("/test-update")
async def test_update_status(request: Request):
    from app.tasks.status_updater import update_task_status
    
    try:
        body = await request.json()
        sale_car_id = body.get("sale_car_id")
        status = body.get("status", "TestStatus")
        
        if not sale_car_id:
            return {"error": "sale_car_id is required"}
        
        await update_task_status(sale_car_id, status)
        return {
            "message": "Status updated successfully",
            "sale_car_id": sale_car_id,
            "status": status
        }
    except Exception as e:
        logger.error(f"Error updating status: {e}")
        return {"error": str(e)}

@task_router.get("/test-page", response_class=HTMLResponse)
async def get_test_page(request: Request):
    return templates.TemplateResponse(
        "sse_test.html",
        {
            "request": request,
            "title": "SSE Task Status Test"
        }
    )
