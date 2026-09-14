# Предложения цены

Торг по опубликованному объявлению: создание предложения, списки «отправленные» и
«полученные», просмотр, отзыв покупателем, принятие и отклонение продавцом. Окружение,
учётные записи и формат ошибки — в [README.md](README.md).

Опубликованное объявление `<PUB_ID>` продавца `SELLER_A` готовится по порядку: TC-LST-001
(черновик) → TC-LST-004 с телом FILL и 3 фото (listings-1.md) → TC-LST-010 (`submit`, listings-2.md)
→ TC-MOD-002 (одобрение, moderation.md). `<PUB_ID>` — `sale_car_id` из TC-LST-001.
`SELLER_A`, `BUYER_B` и `IMPORTER_I` должны иметь `is_guest = false` (см. README, «Роли»):
гость не торгуется.

### TC-OFR-001 — Предложение создаётся в статусе `pending` со сроком жизни 72 часа

| Поле | Значение |
|---|---|
| ID | TC-OFR-001 |
| Название | Предложение создаётся в статусе `pending` со сроком жизни 72 часа |
| История | 10 — Офферы: отзыв, истечение, автоотклонение при продаже |
| Описание | Основной сценарий торга; срок `expires_at` виден сразу |
| Приоритет | High |
| Предусловия | Опубликованное `<PUB_ID>`; `BUYER_B` не имеет живого предложения на него |
| Тестовые данные | `{"sale_car_id": "<PUB_ID>", "price": 1000000.0}` |
| Шаги | 1. `POST /offer/` (со слешем в конце), `Authorization: Bearer <TOKEN_BUYER_B>`, `Content-Type: application/json`, тело<br>2. `GET /offer/my?side=sent`, `Authorization: Bearer <TOKEN_BUYER_B>`<br>3. `GET /offer/my?side=received`, `Authorization: Bearer <TOKEN_SELLER_A>` |
| Ожидаемый результат | 1: `201`; `offer_id` присутствует (UUID); `sale_car_id` = `<PUB_ID>`; `user_id` = `id` записи `BUYER_B`; `price` = `1000000.0`; `status` = `pending`; `created_at` и `updated_at` присутствуют; `can_review` = `false`; `review_id` = `null`; `expires_at` = время запроса (UTC) + `OFFER_LIFE_HOURS` (по умолчанию 72 ч) ± 1 мин<br>2: `200`, массив содержит `offer_id` со `status` = `pending`<br>3: `200`, массив содержит тот же `offer_id`; в `side=sent` продавца его нет |
| Статус | Not run |
| Фактический результат | |

### TC-OFR-002 — На своё объявление, повторное живое, несуществующее и неопубликованное объявление

| Поле | Значение |
|---|---|
| ID | TC-OFR-002 |
| Название | На своё объявление, повторное живое, несуществующее и неопубликованное объявление |
| История | 10 — Офферы: отзыв, истечение, автоотклонение при продаже |
| Описание | Продавец не торгуется сам с собой; у покупателя одно живое предложение на машину; торг только по опубликованному |
| Приоритет | High |
| Предусловия | Выполнен TC-OFR-001; черновик `<DRAFT_ID>` у `SELLER_A` |
| Тестовые данные | Тело как в TC-OFR-001; `<RANDOM_UUID>` — случайный UUID |
| Шаги | 1. `POST /offer/`, `Authorization: Bearer <TOKEN_SELLER_A>`, `{"sale_car_id": "<PUB_ID>", "price": 1000000.0}`<br>2. `POST /offer/`, `Authorization: Bearer <TOKEN_BUYER_B>`, то же тело<br>3. `POST /offer/`, `Authorization: Bearer <TOKEN_BUYER_B>`, `{"sale_car_id": "<RANDOM_UUID>", "price": 1000000.0}`<br>4. `POST /offer/`, `Authorization: Bearer <TOKEN_BUYER_B>`, `{"sale_car_id": "<DRAFT_ID>", "price": 1000000.0}` |
| Ожидаемый результат | 1: `409`, `code` = `OFFER_ON_OWN_CAR`<br>2: `409`, `code` = `DUPLICATE_PENDING_OFFER`<br>3: `404`, `code` = `LISTING_NOT_FOUND`<br>4: `404`, `code` = `LISTING_NOT_FOUND` |
| Статус | Not run |
| Фактический результат | |

### TC-OFR-003 — `price` = 0 — `422`; гость — `403 GUEST_FORBIDDEN`; без токена — `401`

| Поле | Значение |
|---|---|
| ID | TC-OFR-003 |
| Название | `price` = 0 — `422`; гость — `403 GUEST_FORBIDDEN`; без токена — `401` |
| История | 10 — Офферы: отзыв, истечение, автоотклонение при продаже |
| Описание | Цена строго больше нуля; гость не торгуется; все ручки `/offer` требуют входа |
| Приоритет | Medium |
| Предусловия | Опубликованное `<PUB_ID>`; `GUEST_G` |
| Тестовые данные | `{"sale_car_id": "<PUB_ID>", "price": 0}`; `{"sale_car_id": "<PUB_ID>", "price": 1000000.0}` |
| Шаги | 1. `POST /offer/`, `Authorization: Bearer <TOKEN_BUYER_B>`, тело с `price: 0`<br>2. `POST /offer/`, `Authorization: Bearer <TOKEN_GUEST_G>`, тело с `price: 1000000.0`<br>3. `POST /offer/` без `Authorization`, тело с `price: 1000000.0`<br>4. `GET /offer/my` без `Authorization`<br>5. `GET /offer/car/<PUB_ID>` без `Authorization` |
| Ожидаемый результат | 1: `422`, `code` = `VALIDATION_ERROR`, в `details.errors[]` поле `price`<br>2: `403`, `code` = `GUEST_FORBIDDEN`<br>3–5: `401` |
| Статус | Not run |
| Фактический результат | |

### TC-OFR-004 — Список по машине — только продавцу; одно предложение — только его сторонам

| Поле | Значение |
|---|---|
| ID | TC-OFR-004 |
| Название | Список по машине — только продавцу; одно предложение — только его сторонам |
| История | 10 — Офферы: отзыв, истечение, автоотклонение при продаже |
| Описание | Торг закрыт посторонним, пока продавец сам не открыл его показ |
| Приоритет | High |
| Предусловия | Предложение `<OFFER_ID>` от `BUYER_B` на `<PUB_ID>`; показ торга продавцом не включён; `IMPORTER_I` — посторонний |
| Тестовые данные | `<PUB_ID>` — см. подготовку в начале файла; `<OFFER_ID>` — `offer_id` из шага 1 TC-OFR-001 |
| Шаги | 1. `GET /offer/car/<PUB_ID>`, `Authorization: Bearer <TOKEN_SELLER_A>`<br>2. `GET /offer/car/<PUB_ID>`, `Authorization: Bearer <TOKEN_IMPORTER_I>`<br>3. `GET /offer/<OFFER_ID>`, `Authorization: Bearer <TOKEN_IMPORTER_I>`<br>4. `GET /offer/<OFFER_ID>`, `Authorization: Bearer <TOKEN_BUYER_B>` |
| Ожидаемый результат | 1: `200`, массив содержит `<OFFER_ID>`<br>2: `403`, `code` = `NOT_CAR_OWNER`<br>3: `403`, `code` = `NOT_OFFER_PARTY`<br>4: `200`, `offer_id` = `<OFFER_ID>` |
| Статус | Not run |
| Фактический результат | |

### TC-OFR-005 — `not-a-uuid` — `422 MALFORMED_IDENTIFIER`; неизвестный UUID — `404 OFFER_NOT_FOUND`

| Поле | Значение |
|---|---|
| ID | TC-OFR-005 |
| Название | `not-a-uuid` — `422 MALFORMED_IDENTIFIER`; неизвестный UUID — `404 OFFER_NOT_FOUND` |
| История | 10 — Офферы: отзыв, истечение, автоотклонение при продаже |
| Описание | Кривой идентификатор раньше давал 500; теперь это явный отказ |
| Приоритет | Low |
| Предусловия | `SELLER_A` |
| Тестовые данные | `not-a-uuid`; `<RANDOM_UUID>` |
| Шаги | 1. `GET /offer/not-a-uuid`, `Authorization: Bearer <TOKEN_SELLER_A>`<br>2. `GET /offer/<RANDOM_UUID>`, `Authorization: Bearer <TOKEN_SELLER_A>` |
| Ожидаемый результат | 1: `422`, `code` = `MALFORMED_IDENTIFIER`, `details.field` = `offer_id`<br>2: `404`, `code` = `OFFER_NOT_FOUND` |
| Статус | Not run |
| Фактический результат | |

### TC-OFR-006 — `withdraw` переводит в `withdrawn`; после этого можно сделать новое предложение

| Поле | Значение |
|---|---|
| ID | TC-OFR-006 |
| Название | `withdraw` переводит в `withdrawn`; после этого можно сделать новое предложение |
| История | 10 — Офферы: отзыв, истечение, автоотклонение при продаже |
| Описание | Отозванное предложение не считается живым и не блокирует следующее |
| Приоритет | High |
| Предусловия | Предложение `<OFFER_ID>` от `BUYER_B` на `<PUB_ID>` в статусе `pending` |
| Тестовые данные | `{"sale_car_id": "<PUB_ID>", "price": 950000.0}` |
| Шаги | 1. `POST /offer/<OFFER_ID>/withdraw`, `Authorization: Bearer <TOKEN_SELLER_A>`<br>2. `POST /offer/<OFFER_ID>/withdraw`, `Authorization: Bearer <TOKEN_BUYER_B>`<br>3. `GET /offer/<OFFER_ID>`, `Authorization: Bearer <TOKEN_SELLER_A>`<br>4. `POST /offer/`, `Authorization: Bearer <TOKEN_BUYER_B>`, тело |
| Ожидаемый результат | 1: `403`, `code` = `NOT_OFFER_AUTHOR`; статус остаётся `pending`<br>2: `200`, `status` = `withdrawn`<br>3: `200`, `status` = `withdrawn`<br>4: `201`, `status` = `pending` |
| Статус | Not run |
| Фактический результат | |

### TC-OFR-007 — `accepted` продаёт машину, остальные живые предложения становятся `car_sold`

| Поле | Значение |
|---|---|
| ID | TC-OFR-007 |
| Название | `accepted` продаёт машину, остальные живые предложения становятся `car_sold` |
| История | 10 — Офферы: отзыв, истечение, автоотклонение при продаже |
| Описание | Принятие закрывает сделку; объявление уходит из ленты, новые предложения невозможны |
| Приоритет | High |
| Предусловия | На `<PUB_ID>` живые предложения `<OFFER_B>` от `BUYER_B` и `<OFFER_I>` от `IMPORTER_I` |
| Тестовые данные | `{"status": "accepted"}` |
| Шаги | 1. `PATCH /offer/<OFFER_B>/status`, `Authorization: Bearer <TOKEN_SELLER_A>`, `Content-Type: application/json`, тело<br>2. `GET /offer/<OFFER_I>`, `Authorization: Bearer <TOKEN_SELLER_A>`<br>3. `GET /sale_car/<PUB_ID>` без заголовков<br>4. `GET /offer/my?side=sent`, `Authorization: Bearer <TOKEN_BUYER_B>`<br>5. `POST /offer/`, `Authorization: Bearer <TOKEN_IMPORTER_I>`, `{"sale_car_id": "<PUB_ID>", "price": 1000000.0}`<br>6. `GET /sale_car/list?size=60` без заголовков |
| Ожидаемый результат | 1: `200`, `status` = `accepted`<br>2: `200`, `status` = `car_sold`<br>3: `200`, `status` = `sold`<br>4: `200`, у `<OFFER_B>` `can_review` = `true`<br>5: `404`, `code` = `LISTING_NOT_FOUND`<br>6: `200`; `items` не содержит `<PUB_ID>` |
| Статус | Not run |
| Фактический результат | |

### TC-OFR-008 — Решает только продавец и только по `pending`; отклонение не трогает остальные

| Поле | Значение |
|---|---|
| ID | TC-OFR-008 |
| Название | Решает только продавец и только по `pending`; отклонение не трогает остальные |
| История | 10 — Офферы: отзыв, истечение, автоотклонение при продаже |
| Описание | Покупатель не может сам принять своё предложение; решённое остаётся решённым |
| Приоритет | High |
| Предусловия | На `<PUB_ID>` живые `<OFFER_B>` от `BUYER_B` и `<OFFER_I>` от `IMPORTER_I` |
| Тестовые данные | `{"status": "accepted"}`; `{"status": "rejected"}`; `{"status": "withdrawn"}` |
| Шаги | 1. `PATCH /offer/<OFFER_B>/status`, `Authorization: Bearer <TOKEN_BUYER_B>`, `{"status": "accepted"}`<br>2. `PATCH /offer/<OFFER_B>/status`, `Authorization: Bearer <TOKEN_SELLER_A>`, `{"status": "withdrawn"}`<br>3. `PATCH /offer/<OFFER_B>/status`, `Authorization: Bearer <TOKEN_SELLER_A>`, `{"status": "rejected"}`<br>4. `PATCH /offer/<OFFER_B>/status`, `Authorization: Bearer <TOKEN_SELLER_A>`, `Content-Type: application/json`, `{"status": "rejected"}`<br>5. `POST /offer/<OFFER_B>/withdraw`, `Authorization: Bearer <TOKEN_BUYER_B>`<br>6. `GET /offer/<OFFER_I>`, `Authorization: Bearer <TOKEN_SELLER_A>`<br>7. `GET /sale_car/<PUB_ID>`, `Authorization: Bearer <TOKEN_SELLER_A>` |
| Ожидаемый результат | 1: `403`, `code` = `NOT_CAR_OWNER`<br>2: `422`, `code` = `VALIDATION_ERROR` (допустимы только `accepted`, `rejected`)<br>3: `200`, `status` = `rejected`<br>4: `409`, `code` = `OFFER_ALREADY_SETTLED`, `details.current_status` = `rejected`<br>5: `409`, `code` = `OFFER_ALREADY_SETTLED`<br>6: `200`, `offer_id` = `<OFFER_I>`, `status` = `pending`<br>7: `200`, `status` = `published` |
| Статус | Not run |
| Фактический результат | |
