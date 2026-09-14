# Ручные тест-кейсы backend API

Набор ручных проверок HTTP API бэкенда (FastAPI). Кейсы описывают поведение, которое
реально поставлено и закреплено автотестами в `backend/tests/`. Их может выполнить
любой человек с `curl`, Postman или Insomnia, не читая исходный код.

## 1. Окружение

Стек поднимается из `infra/docker-compose.yml` (порты и пароли берутся из `infra/.env`,
шаблон — `infra/.env.example`):

| Сервис | Назначение |
|---|---|
| `postgres` | основная БД |
| `redis` | кэш, отзыв токенов, очередь ARQ, рассылка событий |
| `minio` | S3-хранилище фото, СТС, обложек, аватаров |
| `backend` | FastAPI (uvicorn), слушает 8000 внутри сети |
| `worker` | ARQ-воркер (распознавание СТС и толщиномера) |
| `frontend` | nginx: отдаёт SPA и проксирует `/api/` на `backend` |

```bash
cp infra/.env.example infra/.env
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d --build
```

Базовый URL (префикс `/api/v1` задан в `backend/app/main.py`):

| Путь | Базовый URL | Когда |
|---|---|---|
| через nginx | `http://localhost:3000/api/v1` | `FRONTEND_HOST_PORT=3000` из `.env.example`; если порт в `.env` изменён на 80 — `http://localhost/api/v1` |
| напрямую | `http://localhost:8000/api/v1` | `BACKEND_HOST_PORT=8000`, опубликован только на `127.0.0.1` |

Во всех кейсах пути указаны **относительно базового URL**: `POST /auth/guest/login`
означает `POST http://localhost:8000/api/v1/auth/guest/login`.
WebSocket чата: `ws://localhost:8000/api/v1/chat/ws?token=<access_token>`.

## 2. Как получить токен

Самый дешёвый способ — гостевой вход (без внешнего провайдера):

```bash
curl -X POST http://localhost:8000/api/v1/auth/guest/login \
  -H "Content-Type: application/json" \
  -d '{"device_id": "qa-seller-001"}'
```

Ответ `200`: `{"access_token": "...", "refresh_token": "...", "token_type": "bearer"}`.
Дальше каждый защищённый запрос несёт заголовок `Authorization: Bearer <access_token>`.
Один `device_id` — одна учётная запись: повторный вход с тем же `device_id` возвращает
того же пользователя. Для второго участника используйте другой `device_id`.

Вход через Яндекс (`GET /auth/oauth/yandex/start` → callback → `POST /auth/oauth/exchange`)
требует настоящих ключей Яндекса и проверяется отдельно (см. `auth.md`).

### Роли

Ролей API не выдаёт само по себе (кроме одобрения заявки на роль и консоли admin),
поэтому тестовые роли назначаются в БД. `user_id` берётся из поля `id` payload токена
(jwt.io) или из `GET /user/profile`:

```sql
-- docker compose exec postgres psql -U <POSTGRES_USER> <POSTGRES_DB>
UPDATE users SET role = 'manager', is_guest = false WHERE id = '<user_id>';
```

Роли: `guest`, `user`, `importer`, `manager` (модератор), `admin`.

### Именованные учётные записи

Кейсы ссылаются на эти имена. Подготовьте их один раз перед прогоном.

| Имя в кейсах | `device_id` | Роль |
|---|---|---|
| `SELLER_A` | `qa-seller-a` | `user` |
| `BUYER_B` | `qa-buyer-b` | `user` |
| `GUEST_G` | `qa-guest-g` | `guest` (роль не менять) |
| `MODERATOR_M` | `qa-moderator-m` | `manager` |
| `ADMIN_X` | `qa-admin-x` | `admin` |
| `IMPORTER_I` | `qa-importer-i` | `importer` |

`<TOKEN_SELLER_A>` и т. п. в шагах — `access_token` соответствующей записи.

## 3. Формат ошибки

Любая ошибка API возвращается в одном конверте (`backend/app/core/exceptions`):

```json
{"error": true, "message": "Authentication required", "code": "UNAUTHENTICATED", "details": {}}
```

| HTTP | `code` по умолчанию |
|---|---|
| 401 | `UNAUTHENTICATED` |
| 403 | `PERMISSION_DENIED` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` / `BUSINESS_RULE_VIOLATED` |
| 413 | `PAYLOAD_TOO_LARGE` |
| 422 | `VALIDATION_ERROR`, в `details.errors[]` — `{field, message, type}` |
| 502 | `EXTERNAL_SERVICE_ERROR` |

Некоторые ручки возвращают собственный `code` (например, код отказа перехода статуса) —
он указан в ожидаемом результате кейса.

## 4. Шаблон кейса и легенда

Каждый кейс — таблица из одинаковых полей:

| Поле | Смысл |
|---|---|
| **ID** | `TC-<ОБЛАСТЬ>-NNN`, уникален во всём наборе |
| **Название** | какой результат проверяется |
| **История** | номер и название истории из `ProductSpecification/stories/` |
| **Описание** | зачем кейс существует, какое требование он защищает |
| **Приоритет** | High — основной сценарий или безопасность; Medium — важное правило; Low — граничный случай |
| **Предусловия** | учётные записи и состояние данных до шага 1 |
| **Тестовые данные** | точные тела запросов, файлы, значения |
| **Шаги** | нумерованные; один шаг — один HTTP-запрос (метод, путь, заголовки, тело) |
| **Ожидаемый результат** | точный HTTP-статус и поля ответа / `code` ошибки |
| **Статус** | `Not run` / `Pass` / `Fail` / `Blocked` |
| **Фактический результат** | заполняет исполнитель |

Статусы:

- **Not run** — кейс ещё не выполнялся (исходное значение).
- **Pass** — фактический результат совпал с ожидаемым полностью.
- **Fail** — хотя бы одно расхождение; опишите его в «Фактический результат».
- **Blocked** — выполнить нельзя (не поднят сервис, не выполнено предусловие, упал
  предыдущий кейс); укажите причину.

## 5. Индекс файлов

| Файл | Область | Истории |
|---|---|---|
| [auth.md](auth.md) | Вход гостя, обновление и отзыв токенов, Яндекс OAuth | 01, 19 |
| [account.md](account.md) | Профиль, аватар, удаление учётной записи | 21 |
| [catalog.md](catalog.md) | Каталог марок и моделей | 06 |
| [listings-1.md](listings-1.md) | Создание, чтение, правка, удаление объявления | 04, 07 |
| [listings-2.md](listings-2.md) | Жизненный цикл объявления, телефон продавца | 04, 07 |
| [recognition.md](recognition.md) | СТС: загрузка документа, автозаполнение, VIN, SSE | 06, 20 |
| [photos.md](photos.md) | Галерея фото объявления | 05 |
| [feed.md](feed.md) | Лента объявлений, фильтры, пагинация | 07 |
| [moderation.md](moderation.md) | Очередь модерации, счётчики, жалобы, «кто решил» | 09, 22 |
| [offers.md](offers.md) | Предложения цены | 10 |
| [chat.md](chat.md) | Диалоги, сообщения, непрочитанные, WebSocket | 11 |
| [reviews.md](reviews.md) | Отзывы и рейтинг продавца | 12 |
| [roles.md](roles.md) | Роли и заявки на роль | 13 |
| [admin.md](admin.md) | Консоль администратора: карточка, журнал, блокировка | 23, 24 |
| [thickness-map.md](thickness-map.md) | Карта толщины ЛКП и распознавание толщиномера | 14, 15, 26 |
| [supplier-import.md](supplier-import.md) | Профиль поставщика, модерация, объявления под заказ | 16, 17 |
| [buyer-requests.md](buyer-requests.md) | Заявки покупателей и ответы поставщиков | 18 |
