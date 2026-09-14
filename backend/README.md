# absolute — бэкенд

## Назначение

Бэкенд автомобильной площадки. Отдаёт ленту объявлений с фильтрами, сортировкой и
пагинацией и детальную карточку с раскрытием телефона по запросу. Ведёт объявление от
черновика через модерацию до продажи и хранит его фотогалерею и документы в объектном
хранилище. Распознаёт скан СТС и заполняет по нему черновик. Хранит карту замеров
толщиномера по панелям кузова, в том числе значения, прочитанные с фотографии экрана
прибора. Отвечает за офферы с отзывом и истечением, чат покупателя и продавца,
очередь модерации с жалобами, рейтинг продавца с отзывами, роли и заявки на них,
консоль администратора, а для импорта — профили и витрины поставщиков, объявления под
привоз, заявки покупателей и отклики на них. Вход через Yandex ID или гостевой.

## Стек

- Python 3.12; FastAPI 0.104.1, Starlette 0.27.0, Uvicorn 0.24.0, Pydantic 2.11
- SQLAlchemy 2.0.43 (asyncpg 0.30), GeoAlchemy2 0.18, Alembic 1.16.5
- PostgreSQL 17 (compose) / 16 (CI), Redis 7, ARQ 0.28.0, MinIO через boto3 1.40
- PyJWT 2.10, argon2-cffi, bcrypt; tesseract, OpenCV, Pillow, GigaChat 0.1.42; loguru
- Тесты: pytest 8.3.4, pytest-asyncio 0.25, pytest-cov 6.0, diff-cover 9.2

## Архитектура

Раскладка feature-major: четыре слоя живут внутри каждой предметной области, а не над
всеми сразу. Полные правила — `.claude/rules/coding-rules.md`.

| Область (`app/features/`) | Назначение |
|---|---|
| `auth` | Вход через Yandex ID (одноразовый код обмена), гостевой вход, токены |
| `account` | Пользователь, профиль, роли и заявки на роль, консоль администратора |
| `catalog` | Справочник марок и моделей, сопоставление по алиасам и нечёткое |
| `listing` | Объявление (`sale_car`): жизненный цикл, лента, галерея, документы, карта толщин |
| `recognition` | Задачи распознавания СТС и их статус |
| `moderation` | Очередь модерации, отклонение с причиной, жалобы |
| `offer` | Офферы: создание, отзыв, истечение, автоотклонение при продаже |
| `chat` | Переписка покупателя и продавца, непрочитанные |
| `review` | Отзывы и рейтинг продавца, публичный профиль |
| `importing` | Поставщики и их витрины, заявки покупателей и отклики |

Слои внутри области:

- `api/` — роутеры и модули представления. Разбирают запрос, зовут сервис, формируют ответ.
  Без SQL и без бизнес-правил.
- `services/` — бизнес-логика и транзакция; работают с моделями, S3, Redis, внешними API.
- `models/` — модели SQLAlchemy. Не импортируют `services`, `api`, `app.tasks`, `app.shared`, `fastapi`.
- `schemas/` — Pydantic-типы запросов и ответов, контракт на проводе.

Направление зависимостей: `api → services → models`. Роутер не импортирует модели и не
строит запросы. Сервис не импортирует `api` и не бросает `HTTPException`: он бросает
доменную ошибку (наследник `BaseErrorApp`), а обработчики из `app/core/exceptions`
переводят её в статус и в единый конверт `error / message / code / details`.
Направление проверяют пробы `.claude/skills/sprint-check/probes/config.json`.

Общая инфраструктура:

- `app/main.py` — сборка приложения; `app/api.py` — таблица монтирования роутеров.
- `app/db/` — движок и `registry.py` (все модели разом); `app/core/` — `config.py` и `exceptions/`.
- `app/shared/storage/` — S3/MinIO и кэш в Redis.
- `app/permissions/` — роли, права и зависимости FastAPI, которые их проверяют.
- `app/sse/` — поток событий объявлений и websocket чата.
- `app/ml/` — чтение СТС и экрана толщиномера (tesseract, модель зрения, GigaChat), разбор VIN.
- `app/tasks/` — задачи ARQ; `app/queue.py` — постановка в очередь; `app/worker.py` —
  процесс воркера (распознавание СТС, расшифровка по VIN, cron истечения офферов раз в 15 минут).
- `app/data/` — справочник марок и сидер `python -m app.data.seed_catalog`; `alembic/` — миграции.

Бэкенд работает несколькими экземплярами (uvicorn плюс воркер ARQ на том же образе), поэтому
состояние не хранится в памяти процесса — только в Postgres или Redis.

## Запуск в контейнерах

Весь стек поднимается из `infra/`; своего compose и Dockerfile у `backend/` нет.

```bash
cd infra
cp .env.example .env        # заполнить SECRET_KEY, REFRESH_TOKEN_SECRET_KEY, YANDEX_* (>= 32 символов)
make up                     # = docker compose up -d --build; затем make ps / make logs
```

Поднимаются: `postgres`, `redis`, `minio`, `minio-init` (создаёт бакет и выходит),
`backend` (при старте `alembic upgrade head`, затем uvicorn на 8000), `worker`
(`arq app.worker.WorkerSettings`), `frontend` (nginx, проксирует `/api` на backend).

- API: `http://localhost:${BACKEND_HOST_PORT}/api/v1/...` (по умолчанию 8000, слушает только 127.0.0.1)
- Проверка: `http://localhost:8000/health` → `{"status": "ok"}`, или `make smoke`
- Документация: `/docs` — вход по ключу `DOCS_API_KEY`, затем `/docs/swagger`; фронтенд — порт 3000

Прочие цели: `migrate`, `restart`, `shell`, `psql`, `down`, `clean` (с томами), `test`.

## Локальный запуск без Docker

Нужны запущенные Postgres, Redis и MinIO (например, из compose с портами из
`docker-compose.override.yml`) и tesseract с русским языком в `PATH`.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp ../infra/.env.example .env      # настройки читаются из окружения и из .env в текущем каталоге
# в .env: POSTGRES_HOST=localhost, REDIS_NETWORK_NAME=localhost,
#         MINIO_NETWORK_NAME=localhost, MINIO_ENDPOINT_URL=http://localhost:9000, секреты
alembic upgrade head
python -m app.data.seed_catalog    # справочник марок
uvicorn app.main:app --reload --port 8000
```

Воркер — в отдельном терминале из `backend/`:

```bash
arq app.worker.WorkerSettings
```

## Тесты

Тесты идут против настоящего приложения и настоящих сервисов, не против моков и не на
SQLite. Нужны:

- Postgres с применёнными миграциями (`alembic upgrade head`) и засеянным справочником
  (`python -m app.data.seed_catalog`);
- Redis — импорт `app.main` поднимает клиента;
- MinIO с учётными данными из `.env` — тесты галереи и документов пишут в хранилище;
- tesseract (`tesseract-ocr`, `tesseract-ocr-rus`) — экран толщиномера в тестах читается им, а не GigaChat.

```bash
cd backend
python -m pytest                          # весь набор (pytest.ini: testpaths=tests, asyncio_mode=auto)
python -m pytest tests/test_offers.py     # один модуль
python -m pytest --cov=app --cov-report=term-missing:skip-covered   # с покрытием
```

Молча ничего не пропускается: `test_cache_*`, `test_catalog_matching`, `test_sts_reading`,
`test_feed_boundaries` без Redis, базы или справочника зовут `pytest.skip` с причиной —
это видно в итоге pytest. В CI всё поднято, так что пропуск там — поломка окружения.

То же, что делает CI, одной командой из корня репозитория (одноразовые контейнеры,
рабочая база не трогается):

```bash
bash scripts/ci-local.sh --backend
bash scripts/ci-local.sh --coverage   # быстрый круг с замером покрытия
```
Или в контейнере против рабочего дерева: `cd infra && make test`.

CI (`.github/workflows/backend.yml`): Postgres 16, Redis 7, MinIO, tesseract; миграции с
откатом и повтором, сидер, pytest с покрытием, `diff-cover --fail-under=60` против `dev`.
Ручные тест-кейсы — [`docs/testing/README.md`](docs/testing/README.md).

## Конфигурация

Шаблон — `infra/.env.example`; один файл питает и интерполяцию compose, и `env_file`
контейнеров. Имена совпадают с алиасами в `app/core/config.py`. Группы:

- Развёртывание и порты хоста: `APP_TAG`, `GHCR_*`, `*_HOST_PORT`
- Приложение: `APP_*`, `DOMAIN`, `ADMIN_EMAIL`
- Postgres: `POSTGRES_USER/PASSWORD/DB/HOST/PORT`
- Redis: `REDIS_NETWORK_NAME/PORT/PASSWORD/USER/USER_PASSWORD`, `REDIS_TTL`
- MinIO: `MINIO_*`, `MINIO_DOCUMENTS_BUCKET` (закрытый бакет), `PUBLIC_PHOTO_BASE_URL`
- JWT: `SECRET_KEY`, `REFRESH_TOKEN_SECRET_KEY` (не короче 32 символов), `ALGORITHM`, сроки токенов
- Документация: `DOCS_API_KEY`
- CORS и cookies: `CORS_ORIGINS`, `FRONTEND_URL`, `COOKIE_*`
- Yandex ID: `YANDEX_*`, `OAUTH_PROVIDER` (`fake` — без похода к провайдеру), `OAUTH_FRONTEND_CALLBACK_URL`
- Распознавание: `OLLAMA_URL`, `OLLAMA_MODEL_NAME`, `GIGA_*`
- Вебхуки: `WEBHOOK_SECRET`, `TG_WEBHOOK_URL` (не задавать пустым — пустая строка не парсится как URL)
- `VK_*` — оставлены только для совместимости, VK OAuth из кода удалён

## Ключевые решения (почему так)

1. **Feature-major раскладка.** Слои внутри области, а не области внутри слоёв: изменение
   одной истории остаётся в одной папке, а межобластной импорт виден в строке импорта.
   URL-пространство знает только `app/api.py`, чтобы префиксы не сталкивались молча.
2. **Единый конверт ошибок** (`app/core/exceptions/base.py`). Клиент ветвится по `code`,
   а не разбирает текст; обработчики переводят в тот же конверт и `HTTPException` FastAPI.
3. **ARQ, а не Celery** (`app/queue.py`). Всё приложение асинхронное; мост `async_to_sync`
   создавал новый цикл на каждый вызов, а соединение asyncpg привязано к циклу, который его
   открыл. С одним циклом на весь воркер уходят и мост, и обходной `NullPool`.
4. **Тесты на Postgres, а не на SQLite** (`.github/workflows/backend.yml`). Схема ведётся
   Alembic'ом под Postgres; прогон на другой базе проверял бы не то приложение. Миграции
   ещё и откатываются в CI, чтобы релиз можно было откатить.
5. **Чтение толщиномера кэшируется в Redis** (`app/ml/gauge_reader.py`). Подсказку и
   сохранение может обслужить разный воркер, поэтому ответ GigaChat лежит в Redis по хэшу
   снимка, а не в памяти процесса.
6. **VIN не берётся у модели зрения** (`app/ml/sts_vision.py`). Зрение выигрывает на
   остальных полях СТС, но теряет или подменяет символы VIN; сомнительный VIN отдаётся как
   «не прочитано» — пустое поле продавец заполнит, а выдуманный номер пройдёт незамеченным.
7. **Yandex ID без PKCE** (`app/features/auth/services/oauth_provider.py`). Код обменивается
   на токен на сервере с секретом, токен не покидает бэкенд — публичного клиента нет.
8. **Порты базы, Redis и консоли MinIO наружу не публикуются** (`infra/docker-compose.yml`).
   Опубликованный порт на сервере — открытая база; для разработки порты возвращает
   локальный `docker-compose.override.yml`.

Обоснования по историям — `interview.md` в `ProductSpecification/stories/` и `stories/done/`.

## Рабочий процесс

- Ветки: `features/<name>` → `dev` → `main`. От `dev`, деплой из `main`, прямых коммитов в `main` нет.
- Pull request'ов в проекте нет: коммиты ложатся прямо в текущую рабочую ветку, а
  сообщение коммита — единственная поверхность ревью, поэтому в теле пишется «почему».
- Conventional Commits: `feat(listing): ...`, `fix: ...`, `refactor: ...`; один коммит на историю.
- Подробности — `.claude/rules/git.md`, `.claude/rules/workflow.md`; лимит 200 строк на файл.
