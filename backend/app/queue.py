"""The job queue.

ARQ rather than Celery: everything else in this project is async, and Celery is not.
Bridging the two meant every task ran through async_to_sync, which spins up a fresh event
loop per call -- and asyncpg binds a connection to the loop that opened it, so the engine
the worker built at start-up could hand a task a connection belonging to a loop that no
longer exists. NullPool hid that by never reusing a connection at all. With one loop for
the life of the worker, both the bridge and that workaround go away.
"""

from arq import create_pool
from arq.connections import RedisSettings as ArqRedis

from app.core.config import RedisSettings

redis_settings = RedisSettings()


def queue_settings() -> ArqRedis:
    return ArqRedis(
        host=redis_settings.redis_network_name,
        port=redis_settings.redis_port,
        username=redis_settings.redis_user or None,
        password=redis_settings.redis_user_password or redis_settings.redis_password or None,
        database=0,
    )


async def enqueue(function, *args):
    """Put one job on the queue and hand back its handle.

    A pool per call rather than one held open for the life of the process: enqueuing
    happens on the rare write path -- a seller uploading a document -- and a pool kept
    across an uvicorn reload outlives the loop it was created on.
    """
    pool = await create_pool(queue_settings())
    try:
        return await pool.enqueue_job(function.__name__, *args)
    finally:
        await pool.aclose()
