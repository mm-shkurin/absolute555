# Python/FastAPI Coding Idioms

Tech binding for `.claude/rules/coding-rules.md`. Adapted from the upstream
python-django profile: this project has no Django and no clean-architecture module tree,
so the layer names below are the real directories under `backend/app/`.

## Deployment

- In-memory state to avoid: module-level `dict`/`set`, mutable default arguments,
  singleton caches in closures, class-level mutable attributes. The Celery worker runs in
  a separate container from uvicorn — anything one of them remembers, the other never sees.
- `app/sse/manager.py` fans out over Redis pub/sub precisely because a local queue would
  only reach the worker that owns the connection. Keep it that way.

## Layers

- `app/api/`: routers. `APIRouter`, `Depends`, request/response schemas, status codes.
- `app/services/`: business rules and transactions. Async SQLAlchemy sessions live here.
- `app/models/`: SQLAlchemy declarative models. No FastAPI, no service imports.
- `app/schemas/`: Pydantic v2 models. The wire contract, not the storage shape.
- `app/tasks/`: Celery tasks. Thin — they call `app/ml/` and one service, and report status.

## Errors

- A service raises a plain Python exception (`ValueError`, or a project exception under
  `app/core/exceptions/`). Routers catch and translate to `HTTPException`.
- Never raise `HTTPException` from a service — it welds the business rule to HTTP and
  makes the rule untestable without a request. This is violated today in
  `offer_service.py`; do not add to it.

## Domain style

- Fixed sets are enums: `class SaleCarStatus(str, PyEnum)`. Serialize the lowercase
  `.value` at the boundary. Add behaviour methods when the enum carries a rule.
- Optional values: `Optional[T]` / `T | None`. Adapters convert `None` at the boundary;
  business code should not thread nulls through.
- Immutable data: `@dataclass(frozen=True)`, transitions via `dataclasses.replace()`.
- Parameter objects: a `dataclass` or a Pydantic model, not a fourth positional argument.
- No `isinstance` dispatch in services. Dispatch at the boundary or use polymorphism.

## Async

- Everything touching the database is `async`. `AsyncSession` from
  `app/db/database.py`; `get_db` as a FastAPI dependency in routers, `get_db_session()`
  as a context manager in Celery tasks.
- Never call a blocking client from an async path. `redis` in `app/api/task.py` is
  synchronous and is deliberately driven through `run_in_executor`; anything similar
  needs the same treatment or an async client.

## Pydantic settings

- Every setting is a field on a `BaseSettings` class in `app/core/config.py` with an
  explicit `alias` naming the environment variable. Add the variable to
  `infra/.env.example` in the same commit.
- An optional URL setting must be left **unset**, never set to an empty string: `VAR=`
  puts `""` in the environment, Pydantic parses it as a URL and rejects it at import
  time, and the container crash-loops before serving anything.
