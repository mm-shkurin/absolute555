"""The job queue, and the one job on it.

These do not exercise a running worker -- the compose stack does that -- but they hold the
plumbing in place: the function the worker registers is the function the API enqueues, and
the job is handed a key rather than the document itself.
"""

import pytest

from app.queue import queue_settings
from app.tasks.decode_vin import decode_vin_from_sts
from app.worker import WorkerSettings


def test_should_register_every_job_the_api_can_enqueue():
    registered = {function.__name__ for function in WorkerSettings.functions}
    assert decode_vin_from_sts.__name__ in registered


def test_should_point_the_worker_at_the_configured_redis():
    settings = queue_settings()
    assert settings.host and settings.port


def test_should_keep_the_worker_from_taking_more_readings_than_it_has_cores_for():
    # Reading a scan is tesseract and OpenCV: a core each, for seconds. ARQ runs jobs on
    # the event loop, so this ceiling is what stops one reading starving the rest.
    assert WorkerSettings.max_jobs <= 4
    assert WorkerSettings.job_timeout >= 60
    assert WorkerSettings.max_tries >= 2


async def test_should_take_a_document_key_rather_than_its_bytes():
    # A scan base64-encoded into a Redis job is megabytes sitting in the broker for
    # something already in object storage.
    import inspect

    parameters = list(inspect.signature(decode_vin_from_sts).parameters)
    assert parameters == ["ctx", "sale_car_id", "sts_key"]
