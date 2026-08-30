"""The ARQ worker process.

One job today -- reading a СТС scan. It is CPU work, not IO: tesseract, OpenCV and Pillow
all run to completion on a core. ARQ runs jobs in the event loop, so that work goes to a
thread through run_in_executor inside the job itself, and this worker keeps max_jobs low
rather than pretending the work is cheap.
"""

from loguru import logger

from app.db.database import get_engine
from app.queue import queue_settings
from app.tasks.decode_vin import decode_vin_from_sts


async def startup(ctx: dict) -> None:
    # Built once for the worker's whole life, on the loop every job will run on.
    get_engine()
    logger.info("worker started")


async def shutdown(ctx: dict) -> None:
    logger.info("worker stopping")


class WorkerSettings:
    redis_settings = queue_settings()
    functions = [decode_vin_from_sts]
    on_startup = startup
    on_shutdown = shutdown

    # A single reading occupies a core for seconds. Two at a time on one container is
    # already more than the machine has to spare; scale by adding containers.
    max_jobs = 2

    # Long enough for a slow scan and a slow GigaChat reply, short enough that a wedged
    # job does not hold a slot forever.
    job_timeout = 300

    # A failed reading is retried twice: GigaChat drops connections often enough that one
    # attempt is not an answer, and the OCR before it is deterministic anyway.
    max_tries = 3
