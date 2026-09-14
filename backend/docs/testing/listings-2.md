# Объявления: жизненный цикл и телефон продавца

Действия продавца над статусом (`submit`, `withdraw`, `sold`, `republish`, `revise`),
заморозка правки на модерации и «Показать номер». Одобрение, отклонение и снятие
модератором — в [moderation.md](moderation.md). Окружение и формат ошибки — в [README.md](README.md);
тело FILL и загрузка фото — в [listings-1.md](listings-1.md).

Переходы: `draft → moderation`; `moderation → published | rejected` (модератор);
`published → withdrawn | sold`; `rejected → draft`; `withdrawn → moderation`; `sold → withdrawn`.
Успешное действие отвечает `200` с телом `{"sale_car_id", "status", "updated_at"}`.
Отказ перехода — `409`, `code: "TRANSITION_NOT_ALLOWED"`, `details: {"current_status", "allowed"}`.

### TC-LST-010 — Отправка полного черновика на модерацию

| Поле | Значение |
|---|---|
| ID | TC-LST-010 |
| Название | `submit` переводит заполненный черновик с 3 фото в `moderation` |
| История | 04 — Жизненный цикл объявления |
| Описание | Основной путь продавца: черновик с обязательными полями и фото уходит на проверку. |
| Приоритет | High |
| Предусловия | Черновик `SELLER_A`, заполненный телом FILL, с 3 фото. |
| Тестовые данные | Тела нет. |
| Шаги | 1. `POST /sale_car/<sale_car_id>/submit`, `Authorization: Bearer <TOKEN_SELLER_A>`.<br>2. `GET /sale_car/<sale_car_id>`, тот же токен. |
| Ожидаемый результат | 1. `200`; `sale_car_id` совпадает, `status: "moderation"`, `updated_at` заполнен.<br>2. `200`; `status: "moderation"`. |
| Статус | Not run |
| Фактический результат | |

### TC-LST-011 — Неполный черновик называет все пропуски

| Поле | Значение |
|---|---|
| ID | TC-LST-011 |
| Название | `submit` неполного черновика — 422 `LISTING_INCOMPLETE` со списком полей |
| История | 04 — Жизненный цикл объявления |
| Описание | Мастер подсвечивает все незаполненные шаги сразу; марка и модель не обязательны. |
| Приоритет | High |
| Предусловия | Новый черновик `SELLER_A` без фото. |
| Тестовые данные | `{"price": 990000.0, "milleage": 120000.0}` |
| Шаги | 1. `PATCH /sale_car/<sale_car_id>`, `<TOKEN_SELLER_A>`, тело из данных.<br>2. `POST /sale_car/<sale_car_id>/submit`, `<TOKEN_SELLER_A>`. |
| Ожидаемый результат | 1. `200`.<br>2. `422`; `code: "LISTING_INCOMPLETE"`; `details.missing_fields` содержит `"phone_number"`, `"year"`, `"photos"` и не содержит `"price"`, `"milleage"`. Статус остаётся `draft`. |
| Статус | Not run |
| Фактический результат | |

### TC-LST-012 — Недопустимый переход и повторная отправка

| Поле | Значение |
|---|---|
| ID | TC-LST-012 |
| Название | `sold` на черновике и второй `submit` — 409 `TRANSITION_NOT_ALLOWED` |
| История | 04 — Жизненный цикл объявления |
| Описание | Переходы проверяются по таблице; двойное нажатие не ставит объявление в очередь дважды. |
| Приоритет | High |
| Предусловия | Черновик `<DRAFT_ID>` и отправленное на модерацию `<MOD_ID>` (TC-LST-010), оба `SELLER_A`. |
| Тестовые данные | — |
| Шаги | 1. `POST /sale_car/<DRAFT_ID>/sold`, `<TOKEN_SELLER_A>`.<br>2. `POST /sale_car/<MOD_ID>/submit`, `<TOKEN_SELLER_A>`. |
| Ожидаемый результат | 1. `409`; `code: "TRANSITION_NOT_ALLOWED"`, `details.current_status: "draft"`, `details.allowed: ["moderation"]`; статус не изменился.<br>2. `409`; `code: "TRANSITION_NOT_ALLOWED"`, `details.current_status: "moderation"`. |
| Статус | Not run |
| Фактический результат | |

### TC-LST-013 — Заморозка правки на модерации

| Поле | Значение |
|---|---|
| ID | TC-LST-013 |
| Название | Текст на модерации не правится (409 `LISTING_FROZEN`), переключатели видимости — правятся |
| История | 04 — Жизненный цикл объявления |
| Описание | Модератор должен одобрить тот текст, что прочитал; закрыть чат или номер продавец может всегда. Кейс же готовит опубликованное объявление для других кейсов. |
| Приоритет | High |
| Предусловия | `<MOD_ID>` в статусе `moderation` (TC-LST-010). |
| Тестовые данные | Шаг 1: `{"price": 1.0}`. Шаг 2: `{"chat_allowed": false}`. |
| Шаги | 1. `PATCH /sale_car/<MOD_ID>`, `<TOKEN_SELLER_A>`, тело шага 1.<br>2. `PATCH /sale_car/<MOD_ID>`, `<TOKEN_SELLER_A>`, тело шага 2.<br>3. `POST /sale_car/<MOD_ID>/approve`, `<TOKEN_MODERATOR_M>` (подготовка публикации). |
| Ожидаемый результат | 1. `409`; `code: "LISTING_FROZEN"`, `details.current_status: "moderation"`; `price` не изменилась.<br>2. `200`; `chat_allowed: false`.<br>3. `200`; `status: "published"`. |
| Статус | Not run |
| Фактический результат | |

### TC-LST-014 — Снять с публикации и вернуть через модерацию

| Поле | Значение |
|---|---|
| ID | TC-LST-014 |
| Название | `withdraw` опубликованного → `withdrawn`; `republish` → `moderation` |
| История | 04 — Жизненный цикл объявления |
| Описание | Снятое объявление возвращается в ленту только через повторную проверку. |
| Приоритет | High |
| Предусловия | Опубликованное объявление `<PUB_ID>` продавца `SELLER_A`. |
| Тестовые данные | — |
| Шаги | 1. `POST /sale_car/<PUB_ID>/withdraw`, `<TOKEN_SELLER_A>`.<br>2. `POST /sale_car/<PUB_ID>/republish`, `<TOKEN_SELLER_A>`.<br>3. `GET /sale_car/list` без токена. |
| Ожидаемый результат | 1. `200`; `status: "withdrawn"`.<br>2. `200`; `status: "moderation"`.<br>3. `200`; в `items` нет `<PUB_ID>`. |
| Статус | Not run |
| Фактический результат | |

### TC-LST-015 — Продано и отмена ошибочной отметки

| Поле | Значение |
|---|---|
| ID | TC-LST-015 |
| Название | `sold` опубликованного → `sold`; `withdraw` проданного → `withdrawn` |
| История | 04 — Жизненный цикл объявления |
| Описание | Отметку «продано» можно снять, если она поставлена по ошибке; объявление уходит из ленты. |
| Приоритет | Medium |
| Предусловия | Опубликованное объявление `<PUB_ID>` продавца `SELLER_A`. |
| Тестовые данные | — |
| Шаги | 1. `POST /sale_car/<PUB_ID>/sold`, `<TOKEN_SELLER_A>`.<br>2. `GET /sale_car/<PUB_ID>` без токена.<br>3. `POST /sale_car/<PUB_ID>/withdraw`, `<TOKEN_SELLER_A>`. |
| Ожидаемый результат | 1. `200`; `status: "sold"`.<br>2. `200`; `status: "sold"` (проданное остаётся читаемым).<br>3. `200`; `status: "withdrawn"`. |
| Статус | Not run |
| Фактический результат | |

### TC-LST-016 — Исправление отклонённого объявления

| Поле | Значение |
|---|---|
| ID | TC-LST-016 |
| Название | `revise` отклонённого → `draft`, `reject_reason` очищается, повторный `submit` проходит |
| История | 04 — Жизненный цикл объявления |
| Описание | Продавец правит объявление по причине отказа и отправляет снова. |
| Приоритет | High |
| Предусловия | `<REJ_ID>` отклонено `MODERATOR_M` через `POST /sale_car/<REJ_ID>/reject` с `{"label": "plate_or_face_visible", "comment": "a licence plate is readable"}` (см. moderation.md). |
| Тестовые данные | — |
| Шаги | 1. `GET /sale_car/<REJ_ID>`, `<TOKEN_SELLER_A>`.<br>2. `POST /sale_car/<REJ_ID>/revise`, `<TOKEN_SELLER_A>`.<br>3. `GET /sale_car/<REJ_ID>`, `<TOKEN_SELLER_A>`.<br>4. `POST /sale_car/<REJ_ID>/submit`, `<TOKEN_SELLER_A>`. |
| Ожидаемый результат | 1. `200`; `status: "rejected"`, `reject_reason` заполнен.<br>2. `200`; `status: "draft"`.<br>3. `200`; `reject_reason: null`.<br>4. `200`; `status: "moderation"`. |
| Статус | Not run |
| Фактический результат | |

### TC-LST-017 — Действия чужого и неавторизованного

| Поле | Значение |
|---|---|
| ID | TC-LST-017 |
| Название | `withdraw` чужим — 404 `LISTING_NOT_FOUND`; без токена — 401 |
| История | 07 — Лента и карточка объявления |
| Описание | Чужой не может менять статус и не узнаёт, что объявление управляемо (404 вместо 403). |
| Приоритет | High |
| Предусловия | Опубликованное `<PUB_ID>` продавца `SELLER_A`; `BUYER_B` вошёл. |
| Тестовые данные | — |
| Шаги | 1. `POST /sale_car/<PUB_ID>/withdraw`, `<TOKEN_BUYER_B>`.<br>2. `POST /sale_car/<PUB_ID>/withdraw` без `Authorization`.<br>3. `GET /sale_car/<PUB_ID>` без токена. |
| Ожидаемый результат | 1. `404`; `code: "LISTING_NOT_FOUND"`.<br>2. `401`; `code: "UNAUTHENTICATED"`.<br>3. `200`; `status: "published"`. |
| Статус | Not run |
| Фактический результат | |

### TC-LST-018 — Показать номер продавца

| Поле | Значение |
|---|---|
| ID | TC-LST-018 |
| Название | `reveal-phone` отдаёт номер вошедшему; аноним — 401; непубличное и несуществующее — 404 |
| История | 07 — Лента и карточка объявления |
| Описание | Номер отдаётся по запросу и только вошедшему; черновик, объявление без номера и неизвестный id отвечают одинаково. |
| Приоритет | High |
| Предусловия | Опубликованное `<PUB_ID>` с `phone_number: "+79995553311"`; черновик `<DRAFT_ID>` с тем же номером; `BUYER_B` вошёл. |
| Тестовые данные | Несуществующий id: `00000000-0000-0000-0000-000000000000`. |
| Шаги | 1. `POST /sale_car/<PUB_ID>/reveal-phone`, `<TOKEN_BUYER_B>`, без тела.<br>2. `POST /sale_car/<PUB_ID>/reveal-phone` без `Authorization`.<br>3. `POST /sale_car/<DRAFT_ID>/reveal-phone`, `<TOKEN_BUYER_B>`.<br>4. `POST /sale_car/00000000-0000-0000-0000-000000000000/reveal-phone`, `<TOKEN_BUYER_B>`. |
| Ожидаемый результат | 1. `200`; `{"phone_number": "+79995553311"}`.<br>2. `401`; `code: "UNAUTHENTICATED"`.<br>3. `404`; `code: "LISTING_NOT_FOUND"`.<br>4. `404`; `code: "LISTING_NOT_FOUND"`. |
| Статус | Not run |
| Фактический результат | |
