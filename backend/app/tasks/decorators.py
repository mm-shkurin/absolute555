from functools import wraps
from asgiref.sync import async_to_sync
from app.celery_worker import celery_app


def async_task(name: str = None, **celery_kwargs):
    def decorator(func):
        task_name = name or func.__name__

        @celery_app.task(name=task_name, **celery_kwargs)
        @wraps(func)
        def wrapper(*args, **kwargs):
            return async_to_sync(func)(*args, **kwargs)

        return wrapper
    return decorator
