from celery import Celery
from app.core.config import RedisSettings, DatabaseSettings
from app.db.database import get_engine 

redis_settings = RedisSettings()

def _build_redis_url(host: str, port: int, db: int = 0, user: str | None = None, password: str | None = None) -> str:
    if user and password:
        return f"redis://{user}:{password}@{host}:{port}/{db}"
    return f"redis://{host}:{port}/{db}"

_broker_url = _build_redis_url(
    host=redis_settings.redis_network_name,
    port=redis_settings.redis_port,
    db=0,
    user=redis_settings.redis_user,
    password=redis_settings.redis_user_password,
)
_backend_url = _build_redis_url(
    host=redis_settings.redis_network_name,
    port=redis_settings.redis_port,
    db=1,
    user=redis_settings.redis_user,
    password=redis_settings.redis_user_password,
)

celery_app = Celery(
    "absolute",
    broker=_broker_url,
    backend=_backend_url,
)

celery_app.conf.update(
    task_annotations={"*": {"rate_limit": "10/s"}},
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)

@celery_app.on_after_configure.connect
def setup_db_engine(sender, **kwargs):
    get_engine()

celery_app.autodiscover_tasks(["app.tasks"])