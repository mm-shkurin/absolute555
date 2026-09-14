# Объявления: создание, чтение, правка, удаление

Черновик объявления (`POST /sale_car`), чтение карточки и своих объявлений, правка полей,
удаление, скрытие чужого и непубличного. Переходы статусов — в [listings-2.md](listings-2.md).
Окружение, учётные записи и формат ошибки — в [README.md](README.md).

## Общие данные

`POST /sale_car` создаёт **пустой** черновик и тела не требует (необязательно
`{"listing_kind": "stock" | "import"}`). Поля заполняются правкой `PATCH /sale_car/{sale_car_id}`.

Идентификаторы марки и модели (справочник заливается сидером из `backend/app/data/car_catalog.json`):

1. `GET /catalog/brands` → в массиве найти элемент с `"slug": "toyota"`, взять `brand_id` → `<BRAND_ID>`.
2. `GET /catalog/brands/<BRAND_ID>/models` → элемент с `"name": "Camry"`, взять `model_id` → `<MODEL_ID>`.

**Тело FILL** (полный набор для отправки на модерацию; обязательны `price`, `milleage`, `phone_number`, `year`):

```json
{"price": 1200000.0, "milleage": 90000.0, "phone_number": "+79995553311", "year": 2014,
 "brand_id": "<BRAND_ID>", "model_id": "<MODEL_ID>", "transmission": "АКПП",
 "engine_power": 150, "description": "Один владелец"}
```

Кроме полей, для отправки нужно не меньше **3 фото** (`MIN_PHOTOS_TO_SUBMIT`):
`POST /sale_car/{sale_car_id}/photos`, multipart, поле `files` (3 файла PNG/JPEG) → `200` (см. [photos.md](photos.md)).

### TC-LST-001 — Вошедший пользователь создаёт пустой черновик

| Поле | Значение |
|---|---|
| ID | TC-LST-001 |
| Название | Вошедший пользователь создаёт пустой черновик |
| История | 04 — Объявление: черновик и жизненный цикл статусов |
| Описание | Мастер сохраняет черновик до заполнения полей; черновик виден владельцу в «Моих объявлениях». |
| Приоритет | High |
| Предусловия | `SELLER_A` вошёл; у него меньше 5 черновиков. |
| Тестовые данные | Тела нет. |
| Шаги | 1. `POST /sale_car`, `Authorization: Bearer <TOKEN_SELLER_A>`, без тела.<br>2. `GET /sale_car/<sale_car_id>` с тем же токеном.<br>3. `GET /sale_car/user` с тем же токеном. |
| Ожидаемый результат | 1. `201`; `sale_car_id` (UUID), `status: "draft"`, `listing_kind: "stock"`.<br>2. `200`; `status: "draft"`, `price: null`, `phone_number: null`, `autofill.state: "none"`.<br>3. `200`; массив содержит объект с этим `sale_car_id`. |
| Статус | Not run |
| Фактический результат | |

### TC-LST-002 — Обычный продавец не может создать объявление вида `import`

| Поле | Значение |
|---|---|
| ID | TC-LST-002 |
| Название | Обычный продавец не может создать объявление вида `import` |
| История | 17 — Импорт: объявления под привоз |
| Описание | Объявление под привоз обещает доставку; открыть его может только одобренный поставщик. |
| Приоритет | High |
| Предусловия | `SELLER_A` (роль `user`) и `IMPORTER_I` (роль `importer`) вошли. |
| Тестовые данные | `{"listing_kind": "import"}` |
| Шаги | 1. `POST /sale_car`, `Authorization: Bearer <TOKEN_SELLER_A>`, `Content-Type: application/json`, тело из данных.<br>2. То же с `Authorization: Bearer <TOKEN_IMPORTER_I>`. |
| Ожидаемый результат | 1. `403`; `code: "NOT_AN_IMPORTER"`.<br>2. `201`; `listing_kind: "import"`, `status: "draft"`. |
| Статус | Not run |
| Фактический результат | |

### TC-LST-003 — Без входа — 401; шестой черновик — 409 `DRAFT_LIMIT_REACHED`

| Поле | Значение |
|---|---|
| ID | TC-LST-003 |
| Название | Без входа — 401; шестой черновик — 409 `DRAFT_LIMIT_REACHED` |
| История | 04 — Объявление: черновик и жизненный цикл статусов |
| Описание | Одновременно не больше 5 черновиков на пользователя (`MAX_DRAFTS_PER_USER`). |
| Приоритет | Medium |
| Предусловия | Новая гостевая запись (`device_id: "qa-drafts-limit"`) без объявлений. |
| Тестовые данные | Тела нет. |
| Шаги | 1. `POST /sale_car` без заголовка `Authorization`.<br>2. Пять раз `POST /sale_car` с токеном новой записи.<br>3. Шестой `POST /sale_car` с тем же токеном. |
| Ожидаемый результат | 1. `401`; `code: "UNAUTHENTICATED"`.<br>2. Каждый — `201`.<br>3. `409`; `code: "DRAFT_LIMIT_REACHED"`, `details.limit: 5`. |
| Статус | Not run |
| Фактический результат | |

### TC-LST-004 — PATCH сохраняет поля черновика между визитами

| Поле | Значение |
|---|---|
| ID | TC-LST-004 |
| Название | PATCH сохраняет поля черновика между визитами |
| История | 04 — Объявление: черновик и жизненный цикл статусов |
| Описание | Мастер сохраняет каждый шаг отдельной частичной правкой; прежние поля не теряются, цена возвращается как сохранена. |
| Приоритет | High |
| Предусловия | Черновик `SELLER_A` из TC-LST-001. |
| Тестовые данные | Шаг 1: `{"price": 4020000.5}`. Шаг 2: `{"milleage": 120000.0, "phone_number": "+79991112233"}`. |
| Шаги | 1. `PATCH /sale_car/<sale_car_id>`, `Authorization: Bearer <TOKEN_SELLER_A>`, `Content-Type: application/json`, тело шага 1.<br>2. `PATCH` того же пути, тело шага 2.<br>3. `GET /sale_car/<sale_car_id>` с тем же токеном. |
| Ожидаемый результат | 1–2. `200`, тело — объявление.<br>3. `200`; `price: 4020000.5`, `milleage: 120000.0`, `phone_number: "+79991112233"`, `status: "draft"`. |
| Статус | Not run |
| Фактический результат | |

### TC-LST-005 — `{}` — 422 `EMPTY_PATCH`; поле `status` — 422 и статус не меняется

| Поле | Значение |
|---|---|
| ID | TC-LST-005 |
| Название | `{}` — 422 `EMPTY_PATCH`; поле `status` — 422 и статус не меняется |
| История | 04 — Объявление: черновик и жизненный цикл статусов |
| Описание | Статус меняется только действиями жизненного цикла; неизвестное поле отклоняется, а не игнорируется. |
| Приоритет | High |
| Предусловия | Черновик `SELLER_A`. |
| Тестовые данные | Шаг 1: `{}`. Шаг 2: `{"price": 1000.0, "status": "published"}`. |
| Шаги | 1. `PATCH /sale_car/<sale_car_id>`, `Authorization: Bearer <TOKEN_SELLER_A>`, тело `{}`.<br>2. `PATCH` того же пути, тело шага 2.<br>3. `GET /sale_car/<sale_car_id>` с тем же токеном. |
| Ожидаемый результат | 1. `422`; `code: "EMPTY_PATCH"`.<br>2. `422`; `code: "VALIDATION_ERROR"`.<br>3. `200`; `status: "draft"`. |
| Статус | Not run |
| Фактический результат | |

### TC-LST-006 — Чужой черновик, несуществующий и не-UUID идентификатор отвечают одинаковым 404

| Поле | Значение |
|---|---|
| ID | TC-LST-006 |
| Название | Чужой черновик, несуществующий и не-UUID идентификатор отвечают одинаковым 404 |
| История | 08 — Карточка: детальная выдача и раскрытие телефона |
| Описание | 403 подтвердил бы существование идентификатора; черновик, модерация и отклонённое скрыты от всех, кроме владельца и модератора. |
| Приоритет | High |
| Предусловия | Черновик `SELLER_A`; `BUYER_B` вошёл. |
| Тестовые данные | Несуществующий id: `00000000-0000-0000-0000-000000000000`. |
| Шаги | 1. `GET /sale_car/<sale_car_id>`, `Authorization: Bearer <TOKEN_BUYER_B>`.<br>2. `GET /sale_car/00000000-0000-0000-0000-000000000000`, тот же токен.<br>3. `GET /sale_car/not-a-uuid`, тот же токен.<br>4. `PATCH /sale_car/<sale_car_id>`, тот же токен, тело `{"price": 1.0}`.<br>5. `GET /sale_car/<sale_car_id>`, `Authorization: Bearer <TOKEN_MODERATOR_M>`. |
| Ожидаемый результат | 1–4. `404`; `code: "LISTING_NOT_FOUND"` (тела 1 и 2 одинаковы).<br>5. `200`; `status: "draft"`, `price` не равен `1.0`. |
| Статус | Not run |
| Фактический результат | |

### TC-LST-007 — Опубликованная карточка открыта всем, но `phone_number` видят только владелец и модератор

| Поле | Значение |
|---|---|
| ID | TC-LST-007 |
| Название | Опубликованная карточка открыта всем, но `phone_number` видят только владелец и модератор |
| История | 08 — Карточка: детальная выдача и раскрытие телефона |
| Описание | Номер в общей карточке отдал бы все номера площадки скраперу; остальным он доступен через reveal-phone (TC-LST-018). |
| Приоритет | High |
| Предусловия | Опубликованное объявление `SELLER_A` с `phone_number: "+79995553311"` (подготовка — TC-LST-013). |
| Тестовые данные | `<sale_car_id>` — `<MOD_ID>`, опубликованный в шаге 3 TC-LST-013 |
| Шаги | 1. `GET /sale_car/<sale_car_id>` без `Authorization`.<br>2. То же с `Authorization: Bearer <TOKEN_BUYER_B>`.<br>3. То же с `Authorization: Bearer <TOKEN_SELLER_A>`.<br>4. То же с `Authorization: Bearer <TOKEN_MODERATOR_M>`. |
| Ожидаемый результат | 1. `200`; `status: "published"`, `phone_number: null`.<br>2. `200`; `phone_number: null`; в `seller` нет ключа `phone_number`.<br>3–4. `200`; `phone_number: "+79995553311"`. |
| Статус | Not run |
| Фактический результат | |

### TC-LST-008 — `GET /sale_car/user?status=published` отдаёт только опубликованные свои

| Поле | Значение |
|---|---|
| ID | TC-LST-008 |
| Название | `GET /sale_car/user?status=published` отдаёт только опубликованные свои |
| История | 04 — Объявление: черновик и жизненный цикл статусов |
| Описание | «Мои объявления» разложены по корзинам статусов. |
| Приоритет | Medium |
| Предусловия | У `SELLER_A` есть черновик `<DRAFT_ID>` и опубликованное `<PUBLISHED_ID>`. |
| Тестовые данные | `<DRAFT_ID>` — `sale_car_id` из TC-LST-001; `<PUBLISHED_ID>` — `<MOD_ID>` после TC-LST-013 |
| Шаги | 1. `GET /sale_car/user?status=published`, `Authorization: Bearer <TOKEN_SELLER_A>`.<br>2. `GET /sale_car/user` без `Authorization`. |
| Ожидаемый результат | 1. `200`; массив содержит `<PUBLISHED_ID>` и не содержит `<DRAFT_ID>`.<br>2. `401`; `code: "UNAUTHENTICATED"`. |
| Статус | Not run |
| Фактический результат | |

### TC-LST-009 — Владелец удаляет — 204; чужой — 403 `NOT_LISTING_OWNER`; несуществующее — 404

| Поле | Значение |
|---|---|
| ID | TC-LST-009 |
| Название | Владелец удаляет — 204; чужой — 403 `NOT_LISTING_OWNER`; несуществующее — 404 |
| История | 04 — Объявление: черновик и жизненный цикл статусов |
| Описание | Удалять может владелец (или роль с правом на любое объявление); удаление уносит фото и документ. |
| Приоритет | High |
| Предусловия | Черновик `SELLER_A`; `BUYER_B` вошёл. |
| Тестовые данные | Несуществующий id: любой новый UUID. |
| Шаги | 1. `DELETE /sale_car/<sale_car_id>`, `Authorization: Bearer <TOKEN_BUYER_B>`.<br>2. `DELETE /sale_car/<новый UUID>`, `Authorization: Bearer <TOKEN_SELLER_A>`.<br>3. `DELETE /sale_car/<sale_car_id>`, `Authorization: Bearer <TOKEN_SELLER_A>`.<br>4. `GET /sale_car/<sale_car_id>`, `Authorization: Bearer <TOKEN_SELLER_A>`.<br>5. `GET /sale_car/user`, `Authorization: Bearer <TOKEN_SELLER_A>`. |
| Ожидаемый результат | 1. `403`; `code: "NOT_LISTING_OWNER"`.<br>2. `404`; `code: "LISTING_NOT_FOUND"`.<br>3. `204`, тела нет.<br>4. `404`; `code: "LISTING_NOT_FOUND"`.<br>5. `200`; `sale_car_id` в массиве нет. |
| Статус | Not run |
| Фактический результат | |
