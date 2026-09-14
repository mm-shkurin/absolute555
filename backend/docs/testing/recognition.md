# Распознавание: СТС, VIN, автозаполнение, SSE

Загрузка скана СТС на черновик и подписанная ссылка на него, распознавание по VIN,
вписанному руками, поле `autofill` в объявлении и поток событий `GET /task/sse/{sale_car_id}`.
Окружение и формат ошибки — в [README.md](README.md); создание черновика и тело FILL —
в [listings-1.md](listings-1.md). Распознавание идёт в воркере ARQ: API отвечает `202`, не дожидаясь результата.

`autofill.state`: `none` (скана не было), `pending` (читается), `unreadable` (нужен новый снимок),
`undecoded` (поля вписать руками), `done`. `autofill.brand_source` / `model_source`: `ocr`, `seller` или `null`.
Скан СТС — любое изображение JPEG/PNG, например `sts.jpg`.

### TC-REC-001 — Загрузка скана СТС на черновик

| Поле | Значение |
|---|---|
| ID | TC-REC-001 |
| Название | `POST /sale_car/{id}/sts` принимает скан (202) и ставит чтение в очередь |
| История | 06 — Автозаполнение по СТС и справочник |
| Описание | Скан — первый шаг мастера: он прикрепляется к существующему черновику, а не создаёт объявление. |
| Приоритет | High |
| Предусловия | Новый черновик `SELLER_A` (TC-LST-001). |
| Тестовые данные | Файл `sts.jpg`, `image/jpeg`. |
| Шаги | 1. `GET /sale_car/<sale_car_id>`, `<TOKEN_SELLER_A>`.<br>2. `POST /sale_car/<sale_car_id>/sts`, `<TOKEN_SELLER_A>`, `multipart/form-data`, поле `file` = `sts.jpg`.<br>3. `GET /sale_car/<sale_car_id>`, `<TOKEN_SELLER_A>`. |
| Ожидаемый результат | 1. `200`; `autofill.state: "none"`.<br>2. `202`; `{"sale_car_id": "<sale_car_id>", "autofill": {"state": "pending", ...}}`.<br>3. `200`; `task_id` непустой; `autofill.state: "pending"` (или итоговое, если воркер уже закончил), `brand_source` и `model_source` — `null`, пока чтение не завершено. |
| Статус | Not run |
| Фактический результат | |

### TC-REC-002 — Подписанная ссылка на документ

| Поле | Значение |
|---|---|
| ID | TC-REC-002 |
| Название | Владелец получает истекающую ссылку; новый скан заменяет прежний |
| История | 06 — Автозаполнение по СТС и справочник |
| Описание | Документ лежит в закрытом хранилище и отдаётся только подписанной ссылкой. |
| Приоритет | High |
| Предусловия | Черновик `SELLER_A` со сканом (TC-REC-001). |
| Тестовые данные | Второй файл `sts2.png`, `image/png`, другое изображение. |
| Шаги | 1. `GET /sale_car/<sale_car_id>/sts`, `<TOKEN_SELLER_A>`.<br>2. `POST /sale_car/<sale_car_id>/sts`, `<TOKEN_SELLER_A>`, multipart, поле `file` = `sts2.png`.<br>3. `GET /sale_car/<sale_car_id>/sts`, `<TOKEN_SELLER_A>`. |
| Ожидаемый результат | 1. `200`; `{"url": "...", "expires_at": "<дата в будущем>"}`.<br>2. `202`; `autofill.state: "pending"`.<br>3. `200`; `url` отличается от шага 1. |
| Статус | Not run |
| Фактический результат | |

### TC-REC-003 — Доступ к документу: чужой, аноним, модератор

| Поле | Значение |
|---|---|
| ID | TC-REC-003 |
| Название | Чужому — 404, без токена — 401, модератору на модерации — 200 |
| История | 06 — Автозаполнение по СТС и справочник |
| Описание | СТС — персональные данные; видят владелец и модератор, остальным объявление «не существует». |
| Приоритет | High |
| Предусловия | Объявление `SELLER_A` со сканом, заполненное FILL, с 3 фото, отправлено `submit` (статус `moderation`); `BUYER_B` вошёл. |
| Тестовые данные | — |
| Шаги | 1. `GET /sale_car/<sale_car_id>/sts`, `<TOKEN_BUYER_B>`.<br>2. `GET /sale_car/<sale_car_id>/sts` без `Authorization`.<br>3. `GET /sale_car/<sale_car_id>/sts`, `<TOKEN_MODERATOR_M>`. |
| Ожидаемый результат | 1. `404`; `code: "LISTING_NOT_FOUND"`.<br>2. `401`; `code: "UNAUTHENTICATED"`.<br>3. `200`; `url`, `expires_at`. |
| Статус | Not run |
| Фактический результат | |

### TC-REC-004 — Документ удаляется после решения модератора

| Поле | Значение |
|---|---|
| ID | TC-REC-004 |
| Название | После одобрения ссылка владельцу — 404 `LISTING_NOT_FOUND` |
| История | 06 — Автозаполнение по СТС и справочник |
| Описание | Скан хранится только на время проверки; отсутствие документа неотличимо от отсутствия объявления. |
| Приоритет | Medium |
| Предусловия | Объявление из TC-REC-003 в статусе `moderation`. |
| Тестовые данные | — |
| Шаги | 1. `POST /sale_car/<sale_car_id>/approve`, `<TOKEN_MODERATOR_M>`.<br>2. `GET /sale_car/<sale_car_id>/sts`, `<TOKEN_SELLER_A>`. |
| Ожидаемый результат | 1. `200`; `status: "published"`.<br>2. `404`; `code: "LISTING_NOT_FOUND"`. |
| Статус | Not run |
| Фактический результат | |

### TC-REC-005 — Скан на чужом, без входа и на модерации

| Поле | Значение |
|---|---|
| ID | TC-REC-005 |
| Название | Загрузка скана: чужому — 404, без токена — 401, на модерации — 409 `LISTING_FROZEN` |
| История | 06 — Автозаполнение по СТС и справочник |
| Описание | Скан меняет поля, поэтому разрешён только там, где разрешена правка (`draft`, `rejected`). |
| Приоритет | High |
| Предусловия | Черновик `<DRAFT_ID>` и объявление на модерации `<MOD_ID>`, оба `SELLER_A`; `BUYER_B` вошёл. |
| Тестовые данные | Файл `sts.jpg`, поле `file`. |
| Шаги | 1. `POST /sale_car/<DRAFT_ID>/sts`, `<TOKEN_BUYER_B>`, multipart `file`.<br>2. `POST /sale_car/<DRAFT_ID>/sts` без `Authorization`, multipart `file`.<br>3. `POST /sale_car/<MOD_ID>/sts`, `<TOKEN_SELLER_A>`, multipart `file`. |
| Ожидаемый результат | 1. `404`; `code: "LISTING_NOT_FOUND"`.<br>2. `401`; `code: "UNAUTHENTICATED"`.<br>3. `409`; `code: "LISTING_FROZEN"`. |
| Статус | Not run |
| Фактический результат | |

### TC-REC-006 — Распознавание по вписанному VIN

| Поле | Значение |
|---|---|
| ID | TC-REC-006 |
| Название | `decode-vin` принимает VIN (202), нормализует его и ставит чтение в очередь |
| История | 20 — Распознанные поля в мастере |
| Описание | Если VIN со скана не прочитан, продавец переписывает его; номер сохраняется как выбор продавца. |
| Приоритет | High |
| Предусловия | Новый черновик `SELLER_A`. |
| Тестовые данные | `{"vin": "xta-2107 4051234567"}` |
| Шаги | 1. `POST /sale_car/<sale_car_id>/decode-vin`, `<TOKEN_SELLER_A>`, `Content-Type: application/json`, тело из данных.<br>2. `GET /sale_car/<sale_car_id>`, `<TOKEN_SELLER_A>`. |
| Ожидаемый результат | 1. `202`; `sale_car_id` совпадает, `autofill.state: "pending"`.<br>2. `200`; `vin: "XTA21074051234567"`, `task_id` непустой. |
| Статус | Not run |
| Фактический результат | |

### TC-REC-007 — Строка, которая не VIN

| Поле | Значение |
|---|---|
| ID | TC-REC-007 |
| Название | Не-VIN — 422 `VIN_MALFORMED`, задача не ставится |
| История | 20 — Распознанные поля в мастере |
| Описание | VIN — 17 символов ISO 3779 без I, O, Q; номер кузова расшифровать нельзя. |
| Приоритет | Medium |
| Предусловия | Новый черновик `SELLER_A` (`autofill.state: "none"`). |
| Тестовые данные | По очереди: `XTA2107405123456` (16), `XTA210740512345678` (18), `XTA2IO7405I234567` (I, O), `GB6-1000952` (кузов), `""`. |
| Шаги | 1. Для каждого значения: `POST /sale_car/<sale_car_id>/decode-vin`, `<TOKEN_SELLER_A>`, тело `{"vin": "<значение>"}`.<br>2. `GET /sale_car/<sale_car_id>`, `<TOKEN_SELLER_A>`. |
| Ожидаемый результат | 1. Каждый — `422`; `code: "VIN_MALFORMED"`, `details.vin` — отправленная строка.<br>2. `200`; `autofill.state: "none"`. |
| Статус | Not run |
| Фактический результат | |

### TC-REC-008 — VIN на чужом, без входа и на модерации

| Поле | Значение |
|---|---|
| ID | TC-REC-008 |
| Название | `decode-vin`: чужому — 404, без токена — 401, на модерации — 409 `LISTING_FROZEN` |
| История | 20 — Распознанные поля в мастере |
| Описание | Те же границы, что у скана СТС. |
| Приоритет | High |
| Предусловия | Черновик `<DRAFT_ID>` и `<MOD_ID>` в `moderation`, оба `SELLER_A`; `BUYER_B` вошёл. |
| Тестовые данные | `{"vin": "XTA21074051234567"}` |
| Шаги | 1. `POST /sale_car/<DRAFT_ID>/decode-vin`, `<TOKEN_BUYER_B>`, тело из данных.<br>2. То же без `Authorization`.<br>3. `POST /sale_car/<MOD_ID>/decode-vin`, `<TOKEN_SELLER_A>`, тело из данных.<br>4. `GET /sale_car/<DRAFT_ID>`, `<TOKEN_SELLER_A>`. |
| Ожидаемый результат | 1. `404`; `code: "LISTING_NOT_FOUND"`.<br>2. `401`; `code: "UNAUTHENTICATED"`.<br>3. `409`; `code: "LISTING_FROZEN"`.<br>4. `200`; `autofill.state: "none"`. |
| Статус | Not run |
| Фактический результат | |

### TC-REC-009 — Поток событий распознавания (SSE)

| Поле | Значение |
|---|---|
| ID | TC-REC-009 |
| Название | SSE открыт только владельцу; первое событие — `initial` |
| История | 06 — Автозаполнение по СТС и справочник |
| Описание | Поток несёт то, что прочитано из личного документа; без входа и по чужому id не открывается. |
| Приоритет | High |
| Предусловия | Черновик `SELLER_A` со сканом (TC-REC-001); `BUYER_B` вошёл. |
| Тестовые данные | Для шага 4 — `curl -N`. |
| Шаги | 1. `GET /task/sse/not-a-uuid` без `Authorization`.<br>2. `GET /task/sse/not-a-uuid`, `<TOKEN_SELLER_A>`.<br>3. `GET /task/sse/<sale_car_id>`, `<TOKEN_BUYER_B>`.<br>4. `GET /task/sse/<sale_car_id>`, `<TOKEN_SELLER_A>`, `Accept: text/event-stream`; держать соединение 35 с. |
| Ожидаемый результат | 1. `401`; `code: "UNAUTHENTICATED"`.<br>2. `404`; `code: "LISTING_NOT_FOUND"`.<br>3. `404`; `code: "LISTING_NOT_FOUND"`.<br>4. `200`, `Content-Type: text/event-stream`; первая строка `data: {"sale_car_id": "<sale_car_id>", "status": <task_status объявления>, "type": "initial", "timestamp": ...}`; далее события смены статуса задачи и не реже раза в 30 с `data: {"type": "heartbeat", ...}`. |
| Статус | Not run |
| Фактический результат | |
