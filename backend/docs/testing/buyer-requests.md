# Заявки покупателей и ответы поставщиков

Кейсы на заявки покупателя (`/request`): открытие, лимит, закрытие, лента спроса для
поставщика, отклик поставщика и переписка, которую он открывает.
Окружение, учётные записи и формат ошибки — в [README.md](README.md).
Покупатель держит не более 3 открытых заявок. Лента спроса и отклик доступны роли с
правом `manage_supplier_profile` (`importer`, `admin`).

### TC-BRQ-001 — `POST /request` создаёт открытую заявку

| Поле | Значение |
|---|---|
| ID | TC-BRQ-001 |
| Название | `POST /request` создаёт открытую заявку |
| История | 18 — Импорт: заявки покупателя и отклики |
| Описание | Основной путь: спрос без машины — марка, год, бюджет, комментарий |
| Приоритет | High |
| Предусловия | У `BUYER_B` нет открытых заявок |
| Тестовые данные | `{"comment": "Ищу праворульную, до 2 млн", "year_from": 2018, "budget_max": 2000000}` |
| Шаги | 1. `POST /request`, `Authorization: Bearer <TOKEN_BUYER_B>`, `Content-Type: application/json`, тело — тестовые данные |
| Ожидаемый результат | `201`; `request_id` (UUID), `user_id` = id `BUYER_B`, `status = "open"`, `responses_count = 0`, `year_from = 2018`, `brand`/`model` — имена или `null` |
| Статус | Not run |
| Фактический результат | |

### TC-BRQ-002 — Четвёртая открытая заявка — 409 REQUEST_LIMIT_REACHED; закрытие освобождает место

| Поле | Значение |
|---|---|
| ID | TC-BRQ-002 |
| Название | Четвёртая открытая заявка — 409 REQUEST_LIMIT_REACHED; закрытие освобождает место |
| История | 18 — Импорт: заявки покупателя и отклики |
| Описание | Один покупатель не должен вытеснять остальных из ленты поставщика |
| Приоритет | Medium |
| Предусловия | У `BUYER_B` нет открытых заявок |
| Тестовые данные | `{"comment": "Ищу праворульную, до 2 млн"}` |
| Шаги | 1–3. Трижды `POST /request`, `Authorization: Bearer <TOKEN_BUYER_B>`, тело — тестовые данные<br>4. Ещё раз тот же запрос<br>5. `POST /request/<request_id из шага 1>/close`, `Authorization: Bearer <TOKEN_BUYER_B>`<br>6. Ещё раз `POST /request` |
| Ожидаемый результат | 1–3. `201`<br>4. `409`; `code = "REQUEST_LIMIT_REACHED"`, `details.limit = 3`<br>5. `200`; `status = "closed"`<br>6. `201` |
| Статус | Not run |
| Фактический результат | |

### TC-BRQ-003 — Закрытие чужой или несуществующей заявки — 404 REQUEST_NOT_FOUND

| Поле | Значение |
|---|---|
| ID | TC-BRQ-003 |
| Название | Закрытие чужой или несуществующей заявки — 404 REQUEST_NOT_FOUND |
| История | 18 — Импорт: заявки покупателя и отклики |
| Описание | Чужая и отсутствующая заявка отвечают одинаково, чтобы не выдавать живые id |
| Приоритет | High |
| Предусловия | Открытая заявка `BUYER_B` (TC-BRQ-001) |
| Тестовые данные | `<request_id>` из TC-BRQ-001; `00000000-0000-4000-8000-000000000000` |
| Шаги | 1. `POST /request/<request_id>/close`, `Authorization: Bearer <TOKEN_SELLER_A>`<br>2. `POST /request/00000000-0000-4000-8000-000000000000/close`, `Authorization: Bearer <TOKEN_BUYER_B>`<br>3. `GET /request/my`, `Authorization: Bearer <TOKEN_BUYER_B>` |
| Ожидаемый результат | 1–2. `404`; `code = "REQUEST_NOT_FOUND"`<br>3. `200`; заявка `<request_id>` в `status = "open"` |
| Статус | Not run |
| Фактический результат | |

### TC-BRQ-004 — `GET /request`: импортёр — 200 страница открытых; покупатель — 403; без токена — 401

| Поле | Значение |
|---|---|
| ID | TC-BRQ-004 |
| Название | `GET /request`: импортёр — 200 страница открытых; покупатель — 403; без токена — 401 |
| История | 18 — Импорт: заявки покупателя и отклики |
| Описание | Покупателю лента сказала бы, с кем он в очереди |
| Приоритет | High |
| Предусловия | Открытая заявка `BUYER_B` |
| Тестовые данные | `<TOKEN_IMPORTER_I>`, `<TOKEN_BUYER_B>` — токены именованных записей (README, §2) |
| Шаги | 1. `GET /request?page=1&size=20`, `Authorization: Bearer <TOKEN_IMPORTER_I>`<br>2. `GET /request`, `Authorization: Bearer <TOKEN_BUYER_B>`<br>3. `GET /request` без заголовков<br>4. `GET /request?size=61`, `Authorization: Bearer <TOKEN_IMPORTER_I>` |
| Ожидаемый результат | 1. `200`; `{items, total, page: 1, size: 20}`, все `items[].status = "open"`, заявка `BUYER_B` в списке, свежие первыми<br>2. `403`; `code = "PERMISSION_DENIED"`<br>3. `401`; `code = "CREDENTIALS_INVALID"`<br>4. `422`; `code = "VALIDATION_ERROR"` |
| Статус | Not run |
| Фактический результат | |

### TC-BRQ-005 — `PUT /request/{id}/response` — 200 с `dialog_id`, первая строка чата — системная

| Поле | Значение |
|---|---|
| ID | TC-BRQ-005 |
| Название | `PUT /request/{id}/response` — 200 с `dialog_id`, первая строка чата — системная |
| История | 18 — Импорт: заявки покупателя и отклики |
| Описание | Покупатель читает отклик в переписке: цена и срок приходят первой строкой |
| Приоритет | High |
| Предусловия | Открытая заявка `BUYER_B`, `IMPORTER_I` ещё не откликался |
| Тестовые данные | `{"price": 1900000.0, "delivery_days": 40}` |
| Шаги | 1. `PUT /request/<request_id>/response`, `Authorization: Bearer <TOKEN_IMPORTER_I>`, тело — тестовые данные<br>2. `GET /chat/dialogs/<dialog_id>/messages`, `Authorization: Bearer <TOKEN_BUYER_B>`<br>3. `GET /chat/dialogs`, `Authorization: Bearer <TOKEN_BUYER_B>`<br>4. `GET /request/my`, `Authorization: Bearer <TOKEN_BUYER_B>` |
| Ожидаемый результат | 1. `200`; `response_id`, `request_id`, `supplier_id` = id `IMPORTER_I`, `price = 1900000.0`, `delivery_days = 40`, `dialog_id` не пустой<br>2. `200`; `items[0].kind = "system"`, `text` содержит `1 900 000 ₽` (неразрывные пробелы) и `40 дней`<br>3. `200`; есть диалог с `request.request_id = <request_id>`, `listing = null`, `sale_car_id = null`<br>4. `200`; у заявки `responses_count = 1` |
| Статус | Not run |
| Фактический результат | |

### TC-BRQ-006 — Второй `PUT` того же поставщика сохраняет `response_id` и `dialog_id`

| Поле | Значение |
|---|---|
| ID | TC-BRQ-006 |
| Название | Второй `PUT` того же поставщика сохраняет `response_id` и `dialog_id` |
| История | 18 — Импорт: заявки покупателя и отклики |
| Описание | Один поставщик — один отклик на заявку, иначе покупатель видит его дважды |
| Приоритет | Medium |
| Предусловия | TC-BRQ-005 выполнен |
| Тестовые данные | `{"price": 1850000.0, "delivery_days": 35}` |
| Шаги | 1. `PUT /request/<request_id>/response`, `Authorization: Bearer <TOKEN_IMPORTER_I>`, тело — тестовые данные<br>2. `GET /request/<request_id>/responses`, `Authorization: Bearer <TOKEN_BUYER_B>`<br>3. `GET /chat/dialogs/<dialog_id>/messages`, `Authorization: Bearer <TOKEN_BUYER_B>` |
| Ожидаемый результат | 1. `200`; `response_id` и `dialog_id` те же, что в TC-BRQ-005; `price = 1850000.0`<br>2. `200`; массив из 1 элемента<br>3. `200`; `items[].kind = ["system", "system"]` |
| Статус | Not run |
| Фактический результат | |

### TC-BRQ-007 — Автор видит все отклики, поставщик — свой, посторонний — 404

| Поле | Значение |
|---|---|
| ID | TC-BRQ-007 |
| Название | Автор видит все отклики, поставщик — свой, посторонний — 404 |
| История | 18 — Импорт: заявки покупателя и отклики |
| Описание | Поставщик не должен знать цены конкурентов |
| Приоритет | High |
| Предусловия | На заявку `BUYER_B` откликнулись `IMPORTER_I` (`price` 1900000.0) и `ADMIN_X` (`price` 2000000.0) |
| Тестовые данные | `<request_id>` — `request_id` из ответа `POST /request` (TC-BRQ-001); токены — README, §2 |
| Шаги | 1. `GET /request/<request_id>/responses`, `Authorization: Bearer <TOKEN_BUYER_B>`<br>2. Тот же запрос с `Authorization: Bearer <TOKEN_IMPORTER_I>`<br>3. Тот же запрос с `Authorization: Bearer <TOKEN_SELLER_A>` |
| Ожидаемый результат | 1. `200`; цены `{1900000.0, 2000000.0}`<br>2. `200`; ровно `[1900000.0]`<br>3. `404`; `code = "REQUEST_NOT_FOUND"` |
| Статус | Not run |
| Фактический результат | |

### TC-BRQ-008 — Отклик на закрытую заявку — 409 REQUEST_CLOSED

| Поле | Значение |
|---|---|
| ID | TC-BRQ-008 |
| Название | Отклик на закрытую заявку — 409 REQUEST_CLOSED |
| История | 18 — Импорт: заявки покупателя и отклики |
| Описание | Закрытая заявка больше не собирает предложения |
| Приоритет | Medium |
| Предусловия | Заявка `BUYER_B` закрыта через `POST /request/<request_id>/close` |
| Тестовые данные | `{"price": 1900000.0, "delivery_days": 40}` |
| Шаги | 1. `PUT /request/<request_id>/response`, `Authorization: Bearer <TOKEN_IMPORTER_I>`, тело — тестовые данные |
| Ожидаемый результат | `409`; `code = "REQUEST_CLOSED"` |
| Статус | Not run |
| Фактический результат | |

### TC-BRQ-009 — Отклик без роли — 403; неверные поля заявки и отклика — 422

| Поле | Значение |
|---|---|
| ID | TC-BRQ-009 |
| Название | Отклик без роли — 403; неверные поля заявки и отклика — 422 |
| История | 18 — Импорт: заявки покупателя и отклики |
| Описание | Откликается только поставщик; схемы запрещают лишние поля и значения вне границ |
| Приоритет | Medium |
| Предусловия | Открытая заявка `BUYER_B` |
| Тестовые данные | Отклик `{"price": 1900000.0, "delivery_days": 0}`; заявка `{"year_from": 1900}`; заявка `{"vin": "X"}` |
| Шаги | 1. `PUT /request/<request_id>/response`, `Authorization: Bearer <TOKEN_SELLER_A>`, тело `{"price": 1900000.0, "delivery_days": 40}`<br>2. `PUT /request/<request_id>/response`, `Authorization: Bearer <TOKEN_IMPORTER_I>`, тело с `delivery_days: 0`<br>3. `POST /request`, `Authorization: Bearer <TOKEN_BUYER_B>`, тело `{"year_from": 1900}`<br>4. `POST /request`, `Authorization: Bearer <TOKEN_BUYER_B>`, тело `{"vin": "X"}` |
| Ожидаемый результат | 1. `403`; `code = "PERMISSION_DENIED"`<br>2–4. `422`; `code = "VALIDATION_ERROR"`, в `details.errors[]` поле `delivery_days` / `year_from` / `vin` |
| Статус | Not run |
| Фактический результат | |
