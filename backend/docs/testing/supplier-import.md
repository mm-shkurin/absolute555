# Профиль поставщика и объявления под заказ

Кейсы на профиль поставщика (`/supplier`), его модерацию (`/moderation/suppliers`), фото
витрины, правку опубликованной витрины и объявления с `listing_kind = "import"`.
Окружение, учётные записи и формат ошибки — в [README.md](README.md).
Черновик профиля заводится при первом `GET /supplier/me`. Для отправки обязательны
`company_name`, `countries`, `delivery_days_min`, `delivery_days_max`.

### TC-SUP-001 — Первое чтение своего профиля создаёт черновик

| Поле | Значение |
|---|---|
| ID | TC-SUP-001 |
| Название | Первое чтение своего профиля создаёт черновик |
| История | 16 — Импорт: профиль поставщика |
| Описание | Профиль создаётся лениво, при первом чтении, а не при выдаче роли |
| Приоритет | High |
| Предусловия | `IMPORTER_I` ни разу не открывал профиль |
| Тестовые данные | `<TOKEN_IMPORTER_I>` — токен именованной записи (README, §2) |
| Шаги | 1. `GET /supplier/me`, `Authorization: Bearer <TOKEN_IMPORTER_I>` |
| Ожидаемый результат | `200`; `status = "draft"`, `countries = []`, `user_id` = id `IMPORTER_I`, `pending_changes = null` |
| Статус | Not run |
| Фактический результат | |

### TC-SUP-002 — Полный профиль сохраняется и отправляется в очередь

| Поле | Значение |
|---|---|
| ID | TC-SUP-002 |
| Название | Полный профиль сохраняется и отправляется в очередь |
| История | 16 — Импорт: профиль поставщика |
| Описание | Основной путь поставщика: заполнить витрину и отдать её модератору |
| Приоритет | High |
| Предусловия | TC-SUP-001 выполнен, профиль `IMPORTER_I` в `draft` |
| Тестовые данные | `COMPLETE` = `{"company_name": "Ветер с востока", "countries": ["Корея", "Япония"], "brands": ["Kia", "Toyota"], "delivery_days_min": 30, "delivery_days_max": 60, "terms": "Предоплата 30%, растаможка включена"}` |
| Шаги | 1. `PUT /supplier/me`, `Authorization: Bearer <TOKEN_IMPORTER_I>`, `Content-Type: application/json`, тело `COMPLETE`<br>2. `POST /supplier/me/submit`, `Authorization: Bearer <TOKEN_IMPORTER_I>`<br>3. `GET /moderation/suppliers`, `Authorization: Bearer <TOKEN_MODERATOR_M>` |
| Ожидаемый результат | 1. `200`; `company_name = "Ветер с востока"`, `countries = ["Корея", "Япония"]`, `status = "draft"`<br>2. `200`; `status = "pending"`<br>3. `200`; `{items, total}`, в `items[].user_id` есть id `IMPORTER_I` |
| Статус | Not run |
| Фактический результат | |

### TC-SUP-003 — Отправка без обязательных полей — 422 PROFILE_INCOMPLETE

| Поле | Значение |
|---|---|
| ID | TC-SUP-003 |
| Название | Отправка без обязательных полей — 422 PROFILE_INCOMPLETE |
| История | 16 — Импорт: профиль поставщика |
| Описание | Модератор не должен получать витрину без названия и сроков |
| Приоритет | Medium |
| Предусловия | Профиль `IMPORTER_I` в `draft` |
| Тестовые данные | `COMPLETE` из TC-SUP-002 с `"company_name": null, "countries": []` |
| Шаги | 1. `PUT /supplier/me`, `Authorization: Bearer <TOKEN_IMPORTER_I>`, тело — тестовые данные<br>2. `POST /supplier/me/submit`, `Authorization: Bearer <TOKEN_IMPORTER_I>` |
| Ожидаемый результат | 1. `200`<br>2. `422`; `code = "PROFILE_INCOMPLETE"`, `details.missing_fields` содержит `"company_name"` (и `"countries"`) |
| Статус | Not run |
| Фактический результат | |

### TC-SUP-004 — Правка профиля в `pending` — 409 PROFILE_FROZEN

| Поле | Значение |
|---|---|
| ID | TC-SUP-004 |
| Название | Правка профиля в `pending` — 409 PROFILE_FROZEN |
| История | 16 — Импорт: профиль поставщика |
| Описание | Модератор проверяет тот текст, который увидят покупатели |
| Приоритет | Medium |
| Предусловия | TC-SUP-002 выполнен, профиль `IMPORTER_I` в `pending` |
| Тестовые данные | `{"terms": "Другие условия"}` |
| Шаги | 1. `PUT /supplier/me`, `Authorization: Bearer <TOKEN_IMPORTER_I>`, тело — тестовые данные |
| Ожидаемый результат | `409`; `code = "PROFILE_FROZEN"`, `details.current_status = "pending"` |
| Статус | Not run |
| Фактический результат | |

### TC-SUP-005 — Approve публикует профиль в `/supplier/{user_id}` и в ленте `/supplier`

| Поле | Значение |
|---|---|
| ID | TC-SUP-005 |
| Название | Approve публикует профиль в `/supplier/{user_id}` и в ленте `/supplier` |
| История | 16 — Импорт: профиль поставщика |
| Описание | Публичная витрина открыта без токена; до одобрения её нет |
| Приоритет | High |
| Предусловия | Профиль `IMPORTER_I` в `pending` (TC-SUP-002) |
| Тестовые данные | `<IMPORTER_ID>` — id `IMPORTER_I` |
| Шаги | 1. `GET /supplier/<IMPORTER_ID>` без заголовков<br>2. `POST /moderation/suppliers/<IMPORTER_ID>/approve`, `Authorization: Bearer <TOKEN_MODERATOR_M>`<br>3. `GET /supplier/<IMPORTER_ID>` без заголовков<br>4. `GET /supplier?page=1&size=60` без заголовков |
| Ожидаемый результат | 1. `404`; `code = "SUPPLIER_NOT_FOUND"`<br>2. `200`; `status = "published"`<br>3. `200`; `status = "published"`, `delivery_days_max = 60`; полей `pending_changes` и `revision_status` нет<br>4. `200`; `{items, total, page: 1, size: 60}`, в `items` есть `<IMPORTER_ID>` |
| Статус | Not run |
| Фактический результат | |

### TC-SUP-006 — Reject с пустой причиной — 422; с причиной — `rejected`, правка возвращает в `draft`

| Поле | Значение |
|---|---|
| ID | TC-SUP-006 |
| Название | Reject с пустой причиной — 422; с причиной — `rejected`, правка возвращает в `draft` |
| История | 16 — Импорт: профиль поставщика |
| Описание | Отказ без причины не даёт поставщику, что исправить |
| Приоритет | Medium |
| Предусловия | Профиль `IMPORTER_I` в `pending` |
| Тестовые данные | `{"reason": "   "}`; `{"reason": "Условия описаны непонятно"}`; `{"terms": "Предоплата 20%, растаможка включена"}` |
| Шаги | 1. `POST /moderation/suppliers/<IMPORTER_ID>/reject`, `Authorization: Bearer <TOKEN_MODERATOR_M>`, тело `{"reason": "   "}`<br>2. Тот же запрос с `{"reason": "Условия описаны непонятно"}`<br>3. `PUT /supplier/me`, `Authorization: Bearer <TOKEN_IMPORTER_I>`, тело с новым `terms`<br>4. `GET /supplier/<IMPORTER_ID>` без заголовков |
| Ожидаемый результат | 1. `422`; `code = "REJECTION_NEEDS_REASON"`<br>2. `200`; `status = "rejected"`, `reject_reason = "Условия описаны непонятно"`<br>3. `200`; `status = "draft"`, `reject_reason = null`<br>4. `404` |
| Статус | Not run |
| Фактический результат | |

### TC-SUP-007 — Не-импортёр — 403 на `/supplier/me`; не-модератор — 403 на очередь; без токена — 401

| Поле | Значение |
|---|---|
| ID | TC-SUP-007 |
| Название | Не-импортёр — 403 на `/supplier/me`; не-модератор — 403 на очередь; без токена — 401 |
| История | 16 — Импорт: профиль поставщика |
| Описание | Профиль правит только импортёр, решение принимает только модератор |
| Приоритет | High |
| Предусловия | Профиль `IMPORTER_I` в `pending` |
| Тестовые данные | `<IMPORTER_ID>` — `id` из `GET /user/profile` с `Authorization: Bearer <TOKEN_IMPORTER_I>` |
| Шаги | 1. `GET /supplier/me`, `Authorization: Bearer <TOKEN_SELLER_A>`<br>2. `GET /moderation/suppliers`, `Authorization: Bearer <TOKEN_SELLER_A>`<br>3. `POST /moderation/suppliers/<IMPORTER_ID>/approve`, `Authorization: Bearer <TOKEN_SELLER_A>`<br>4. `GET /supplier/me` без заголовков |
| Ожидаемый результат | 1–3. `403`; `code = "PERMISSION_DENIED"`<br>4. `401`; `code = "CREDENTIALS_INVALID"` |
| Статус | Not run |
| Фактический результат | |

### TC-SUP-008 — Витрина несуществующего — 404; `page`/`size` вне границ — 422

| Поле | Значение |
|---|---|
| ID | TC-SUP-008 |
| Название | Витрина несуществующего — 404; `page`/`size` вне границ — 422 |
| История | 16 — Импорт: профиль поставщика |
| Описание | Неопубликованный и отсутствующий профиль отвечают одинаково; `size` ≤ 60 |
| Приоритет | Low |
| Предусловия | — |
| Тестовые данные | Случайный UUID, например `00000000-0000-4000-8000-000000000000` |
| Шаги | 1. `GET /supplier/00000000-0000-4000-8000-000000000000`<br>2. `GET /supplier?page=0`<br>3. `GET /supplier?size=0`<br>4. `GET /supplier?size=61` |
| Ожидаемый результат | 1. `404`; `code = "SUPPLIER_NOT_FOUND"`<br>2–4. `422`; `code = "VALIDATION_ERROR"` |
| Статус | Not run |
| Фактический результат | |

### TC-SUP-009 — PNG ставится как обложка и снимается; не-изображение — 422 NOT_AN_IMAGE

| Поле | Значение |
|---|---|
| ID | TC-SUP-009 |
| Название | PNG ставится как обложка и снимается; не-изображение — 422 NOT_AN_IMAGE |
| История | 16 — Импорт: профиль поставщика |
| Описание | Обложка проходит те же проверки, что фото объявления |
| Приоритет | Medium |
| Предусловия | Профиль `IMPORTER_I` в `draft` |
| Тестовые данные | `cover.png` — настоящий PNG; `fake.png` — текстовый файл |
| Шаги | 1. `PUT /supplier/me/cover`, `Authorization: Bearer <TOKEN_IMPORTER_I>`, `multipart/form-data`, поле `file` = `cover.png` (`image/png`)<br>2. `PUT /supplier/me/cover`, поле `file` = `fake.png`<br>3. `DELETE /supplier/me/cover`, `Authorization: Bearer <TOKEN_IMPORTER_I>`<br>4. Шаг 1 с `Authorization: Bearer <TOKEN_SELLER_A>` |
| Ожидаемый результат | 1. `200`; `cover_url` — адрес, открываемый браузером (не `minio:9000`)<br>2. `422`; `code = "NOT_AN_IMAGE"`<br>3. `200`; `cover_url = null`<br>4. `403`; `code = "PERMISSION_DENIED"` |
| Статус | Not run |
| Фактический результат | |

### TC-SUP-010 — Правка `published` копится в `pending_changes`, витрина не меняется до approve

| Поле | Значение |
|---|---|
| ID | TC-SUP-010 |
| Название | Правка `published` копится в `pending_changes`, витрина не меняется до approve |
| История | 16 — Импорт: профиль поставщика |
| Описание | Витрину не снимают на время проверки правки |
| Приоритет | High |
| Предусловия | Профиль `IMPORTER_I` в `published` (TC-SUP-005) |
| Тестовые данные | `{"terms": "Предоплата 10%"}`; `{"terms": "Ещё раз"}` |
| Шаги | 1. `PUT /supplier/me`, `Authorization: Bearer <TOKEN_IMPORTER_I>`, тело `{"terms": "Предоплата 10%"}`<br>2. `POST /supplier/me/submit`, `Authorization: Bearer <TOKEN_IMPORTER_I>`<br>3. `GET /supplier/<IMPORTER_ID>`<br>4. `PUT /supplier/me`, тело `{"terms": "Ещё раз"}`<br>5. `POST /moderation/suppliers/<IMPORTER_ID>/approve`, `Authorization: Bearer <TOKEN_MODERATOR_M>`<br>6. `GET /supplier/<IMPORTER_ID>` |
| Ожидаемый результат | 1. `200`; `status = "published"`, `pending_changes.terms = "Предоплата 10%"`, `revision_status = "draft"`<br>2. `200`; `revision_status = "pending"`<br>3. `200`; `terms` прежний<br>4. `409`; `code = "PROFILE_FROZEN"`<br>5. `200`; `pending_changes = null`<br>6. `200`; `terms = "Предоплата 10%"` |
| Статус | Not run |
| Фактический результат | |

### TC-SUP-011 — `listing_kind = "import"`: импортёр — 201, продавец — 403 NOT_AN_IMPORTER

| Поле | Значение |
|---|---|
| ID | TC-SUP-011 |
| Название | `listing_kind = "import"`: импортёр — 201, продавец — 403 NOT_AN_IMPORTER |
| История | 17 — Импорт: объявления под привоз |
| Описание | Доставку обещает только одобренный поставщик. Создание объявления — см. TC-LST-001 (listings-1.md) |
| Приоритет | High |
| Предусловия | — |
| Тестовые данные | `{"listing_kind": "import"}`; `IMPORT_FIELDS` = `{"import_country": "Корея", "delivery_days": 45, "turnkey_price": 2450000.0, "price": 2300000.0, "phone_number": "+79130000000"}` |
| Шаги | 1. `POST /sale_car`, `Authorization: Bearer <TOKEN_IMPORTER_I>`, тело `{"listing_kind": "import"}`<br>2. `PATCH /sale_car/<sale_car_id>`, `Authorization: Bearer <TOKEN_IMPORTER_I>`, тело `IMPORT_FIELDS`<br>3. `POST /sale_car`, `Authorization: Bearer <TOKEN_SELLER_A>`, тело `{"listing_kind": "import"}`<br>4. `POST /sale_car`, `Authorization: Bearer <TOKEN_SELLER_A>`, тело `{}` |
| Ожидаемый результат | 1. `201`; `listing_kind = "import"`<br>2. `200`; `import_country = "Корея"`, `delivery_days = 45`, `turnkey_price = 2450000.0`<br>3. `403`; `code = "NOT_AN_IMPORTER"`<br>4. `201`; `listing_kind = "stock"` |
| Статус | Not run |
| Фактический результат | |

### TC-SUP-012 — Без условий привоза submit — 422; опубликованное без VIN видно в `kind=import`

| Поле | Значение |
|---|---|
| ID | TC-SUP-012 |
| Название | Без условий привоза submit — 422; опубликованное без VIN видно в `kind=import` |
| История | 17 — Импорт: объявления под привоз |
| Описание | Вместо VIN и СТС привозной машине обязательны страна, срок и цена под ключ |
| Приоритет | Medium |
| Предусловия | Импортный черновик `IMPORTER_I` (TC-SUP-011, шаг 1) с 3 фото, заполнен только `{"price": 100.0}` |
| Тестовые данные | `IMPORT_FIELDS` из TC-SUP-011 + поля машины как в TC-LST-001 (listings-1.md) |
| Шаги | 1. `POST /sale_car/<sale_car_id>/submit`, `Authorization: Bearer <TOKEN_IMPORTER_I>`<br>2. `PATCH /sale_car/<sale_car_id>` с `IMPORT_FIELDS` и полями машины, затем повторить шаг 1<br>3. `POST /sale_car/<sale_car_id>/approve`, `Authorization: Bearer <TOKEN_MODERATOR_M>`<br>4. `GET /sale_car/list?kind=import` без заголовков |
| Ожидаемый результат | 1. `422`; `details.missing_fields` содержит `import_country`, `delivery_days`, `turnkey_price`<br>2. `200`<br>3. `200`; `GET /sale_car/<sale_car_id>` → `vin = null`<br>4. `200`; в `items` есть объявление с `import_country = "Корея"`, `delivery_days = 45`; объявлений `stock` нет |
| Статус | Not run |
| Фактический результат | |
