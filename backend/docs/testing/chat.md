# Чат: диалоги, сообщения, непрочитанные, WebSocket

Проверки переписки покупателя и продавца: диалог, который открывает предложение цены,
сообщения, отметка «прочитано», счётчик непрочитанных, прямая переписка и живой канал
WebSocket. Чужой диалог и несуществующий неразличимы: оба дают `404 DIALOG_NOT_FOUND`.
Окружение, учётные записи и формат ошибки — в [README.md](README.md).

Общая подготовка «диалог по предложению» (далее — **ДИАЛОГ_AB**): `SELLER_A` создаёт
объявление по TC-LST-001 (listings-1.md), объявление опубликовано (одобрено модератором);
`BUYER_B` делает предложение `POST /offer/` с `{"sale_car_id": "<SALE_CAR_ID>", "price": 900000.0}`
(см. offers.md) → `201`. Отдельной ручки создания диалога нет: его заводит предложение.
`<DIALOG_ID>` — поле `dialog_id` элемента `GET /chat/dialogs` с этим `sale_car_id`.

### TC-CHAT-001 — Предложение цены открывает диалог с системной строкой

| Поле | Значение |
|---|---|
| ID | TC-CHAT-001 |
| Название | Диалог появляется у обеих сторон, первая строка — системная о цене |
| История | 11 — Чат и непрочитанные |
| Описание | Переговоры по машине начинаются в чате автоматически; системную строку пишет сервер, у неё нет автора |
| Приоритет | High |
| Предусловия | Опубликованное объявление `SELLER_A`; `BUYER_B` сделал предложение 900000 (ДИАЛОГ_AB) |
| Тестовые данные | — |
| Шаги | 1. `GET /chat/dialogs`, `Authorization: Bearer <TOKEN_BUYER_B>`<br>2. `GET /chat/dialogs`, `Authorization: Bearer <TOKEN_SELLER_A>`<br>3. `GET /chat/dialogs/<DIALOG_ID>/messages`, `Authorization: Bearer <TOKEN_BUYER_B>` |
| Ожидаемый результат | 1. `200`, массив; есть элемент с `sale_car_id` = `<SALE_CAR_ID>`, `dialog_id`, `listing` (карточка), `counterpart` — продавец, `can_review: true`, `review_id: null`<br>2. `200`, тот же `dialog_id`, `counterpart` — покупатель, `can_review: false`<br>3. `200`, `{items, total, page: 1, size: 50}`; `items[0].kind` = `system`, `author_id: null`, `text` = `Предложена цена 900000 ₽` |
| Статус | Not run |
| Фактический результат | |

### TC-CHAT-002 — Сообщение доходит до собеседника и считается непрочитанным

| Поле | Значение |
|---|---|
| ID | TC-CHAT-002 |
| Название | Отправка сообщения: 201, рост `unread` у второй стороны |
| История | 11 — Чат и непрочитанные |
| Описание | Каждая сторона видит, что написала другая; бейдж считает только чужие сообщения |
| Приоритет | High |
| Предусловия | ДИАЛОГ_AB; записан `unread` из `GET /chat/unread` для `SELLER_A` (N) |
| Тестовые данные | `{"text": "Здравствуйте"}` |
| Шаги | 1. `POST /chat/dialogs/<DIALOG_ID>/messages`, `Authorization: Bearer <TOKEN_BUYER_B>`, `Content-Type: application/json`, тело из тестовых данных<br>2. `GET /chat/unread`, `Authorization: Bearer <TOKEN_SELLER_A>`<br>3. `GET /chat/unread`, `Authorization: Bearer <TOKEN_BUYER_B>`<br>4. `GET /chat/dialogs`, `Authorization: Bearer <TOKEN_SELLER_A>` |
| Ожидаемый результат | 1. `201`, `{message_id, dialog_id: <DIALOG_ID>, author_id: <id BUYER_B>, kind: "text", text: "Здравствуйте", read_at: null, created_at}`<br>2. `200`, `{"unread": N+1}`<br>3. `200`, собственное сообщение в `unread` покупателя не добавилось<br>4. у диалога `last_message.text` = `Здравствуйте`, `unread` ≥ 1 |
| Статус | Not run |
| Фактический результат | |

### TC-CHAT-003 — Отметка «прочитано» только названных чужих сообщений

| Поле | Значение |
|---|---|
| ID | TC-CHAT-003 |
| Название | `POST /read` помечает названные сообщения, свои и повторные — не считаются |
| История | 11 — Чат и непрочитанные |
| Описание | Прочитанным становится только то, что названо и адресовано читателю; момент прочтения не сдвигается повторной отметкой |
| Приоритет | High |
| Предусловия | ДИАЛОГ_AB; `BUYER_B` отправил `Раз`, `Два`, `Три` (TC-CHAT-002, шаг 1); `SELLER_A` отправил `Моё сообщение` (`<OWN_ID>`) |
| Тестовые данные | `<M1>`, `<M2>`, `<M3>` — `message_id` сообщений `Раз`, `Два`, `Три` из `GET /chat/dialogs/<DIALOG_ID>/messages` |
| Шаги | 1. `POST /chat/dialogs/<DIALOG_ID>/read`, `Authorization: Bearer <TOKEN_SELLER_A>`, тело `{"message_ids": ["<M1>", "<M2>"]}`<br>2. Повторить шаг 1<br>3. `POST /chat/dialogs/<DIALOG_ID>/read`, `<TOKEN_SELLER_A>`, тело `{"message_ids": ["<OWN_ID>"]}`<br>4. `POST /chat/dialogs/<DIALOG_ID>/read`, `<TOKEN_SELLER_A>`, тело `{"message_ids": []}` |
| Ожидаемый результат | 1. `200`, `{"marked": 2, "unread": U}`, где U — оставшиеся непрочитанные (включая `<M3>` и системную строку, если она не отмечена); у `<M1>`, `<M2>` в истории заполнен `read_at`<br>2. `200`, `marked: 0`; `read_at` у `<M1>` не изменился<br>3. `200`, `marked: 0`<br>4. `422`, `code: VALIDATION_ERROR` (нужен минимум один идентификатор) |
| Статус | Not run |
| Фактический результат | |

### TC-CHAT-004 — Пагинация истории и границы `size`

| Поле | Значение |
|---|---|
| ID | TC-CHAT-004 |
| Название | История постранична; `size` вне 1..100 и `page` < 1 — 422 |
| История | 11 — Чат и непрочитанные |
| Описание | История длинного разговора отдаётся страницами; запрос вне границ отвергается, а не обрезается молча |
| Приоритет | Medium |
| Предусловия | ДИАЛОГ_AB, в диалоге ≥ 3 сообщений |
| Тестовые данные | — |
| Шаги | 1. `GET /chat/dialogs/<DIALOG_ID>/messages?page=1&size=2`, `Authorization: Bearer <TOKEN_BUYER_B>`<br>2. `GET /chat/dialogs/<DIALOG_ID>/messages?size=0`, тот же токен<br>3. `GET /chat/dialogs/<DIALOG_ID>/messages?size=101`<br>4. `GET /chat/dialogs/<DIALOG_ID>/messages?page=0` |
| Ожидаемый результат | 1. `200`, `items` длиной 2, `total` = всего сообщений, `page: 1`, `size: 2`<br>2–4. `422`, `code: VALIDATION_ERROR` |
| Статус | Not run |
| Фактический результат | |

### TC-CHAT-005 — Постороннему диалог не существует

| Поле | Значение |
|---|---|
| ID | TC-CHAT-005 |
| Название | Не участник получает 404 `DIALOG_NOT_FOUND` на чтение, запись и отметку |
| История | 11 — Чат и непрочитанные |
| Описание | Отказ «запрещено» подтвердил бы, что по машине идёт торг; поэтому чужой и несуществующий диалог отвечают одинаково |
| Приоритет | High |
| Предусловия | ДИАЛОГ_AB; `IMPORTER_I` в нём не участвует |
| Тестовые данные | `<RANDOM_UUID>` — любой новый UUID |
| Шаги | 1. `GET /chat/dialogs/<DIALOG_ID>/messages`, `Authorization: Bearer <TOKEN_IMPORTER_I>`<br>2. `POST /chat/dialogs/<DIALOG_ID>/messages`, `<TOKEN_IMPORTER_I>`, тело `{"text": "Здравствуйте"}`<br>3. `POST /chat/dialogs/<DIALOG_ID>/read`, `<TOKEN_IMPORTER_I>`, тело `{"message_ids": ["<RANDOM_UUID>"]}`<br>4. `GET /chat/dialogs/<RANDOM_UUID>/messages`, `<TOKEN_BUYER_B>`<br>5. `GET /chat/dialogs/not-a-uuid/messages`, `<TOKEN_BUYER_B>` |
| Ожидаемый результат | 1–5. `404`, `{"error": true, "message": "Dialog not found", "code": "DIALOG_NOT_FOUND", ...}`<br>`GET /chat/dialogs` для `IMPORTER_I` не содержит `<DIALOG_ID>` |
| Статус | Not run |
| Фактический результат | |

### TC-CHAT-006 — Чат без токена недоступен

| Поле | Значение |
|---|---|
| ID | TC-CHAT-006 |
| Название | Запросы без `Authorization` — 401 |
| История | 11 — Чат и непрочитанные |
| Описание | Переписка есть только у вошедшего пользователя |
| Приоритет | High |
| Предусловия | ДИАЛОГ_AB |
| Тестовые данные | — |
| Шаги | 1. `GET /chat/dialogs` без заголовка `Authorization`<br>2. `GET /chat/unread` без заголовка<br>3. `GET /chat/dialogs/<DIALOG_ID>/messages` без заголовка<br>4. `POST /chat/dialogs/<DIALOG_ID>/messages` без заголовка, тело `{"text": "hi"}` |
| Ожидаемый результат | 1–4. `401`, `code: UNAUTHENTICATED` |
| Статус | Not run |
| Фактический результат | |

### TC-CHAT-007 — Пустое сообщение и попытка задать `kind`

| Поле | Значение |
|---|---|
| ID | TC-CHAT-007 |
| Название | Пустой текст и лишнее поле `kind` — 422 |
| История | 11 — Чат и непрочитанные |
| Описание | Системную строку («Предложение принято») может написать только сервер; клиент передаёт лишь `text` (1..4000 символов) |
| Приоритет | High |
| Предусловия | ДИАЛОГ_AB |
| Тестовые данные | см. шаги |
| Шаги | 1. `POST /chat/dialogs/<DIALOG_ID>/messages`, `Authorization: Bearer <TOKEN_BUYER_B>`, тело `{"text": "   "}`<br>2. То же, тело `{"text": ""}`<br>3. То же, тело `{"text": "Предложение принято", "kind": "system"}`<br>4. То же, тело `{"text": "<4001 символ>"}` |
| Ожидаемый результат | 1. `422`, `code: EMPTY_MESSAGE`<br>2. `422`, `code: VALIDATION_ERROR`<br>3. `422`, `code: VALIDATION_ERROR` (лишнее поле запрещено)<br>4. `422`, `code: VALIDATION_ERROR`<br>Ни одно сообщение не появилось в истории |
| Статус | Not run |
| Фактический результат | |

### TC-CHAT-008 — Прямая переписка: одна на пару, не с собой

| Поле | Значение |
|---|---|
| ID | TC-CHAT-008 |
| Название | `POST /chat/dialogs/direct/{user_id}` открывает или находит диалог; с собой и с никем — 404 |
| История | 11 — Чат и непрочитанные (прямая переписка со страницы поставщика) |
| Описание | Кнопка «Написать» не плодит диалоги; первая строка системная и называет витрину поставщика |
| Приоритет | Medium |
| Предусловия | `<ID_IMPORTER_I>` и `<ID_BUYER_B>` — поле `id` из `GET /user/profile`; прямого диалога между ними ещё нет |
| Тестовые данные | `<RANDOM_UUID>` — любой новый UUID |
| Шаги | 1. `POST /chat/dialogs/direct/<ID_IMPORTER_I>`, `Authorization: Bearer <TOKEN_BUYER_B>`, без тела<br>2. Повторить шаг 1<br>3. `GET /chat/dialogs/<DIALOG_ID шага 1>/messages`, `<TOKEN_IMPORTER_I>`<br>4. `POST /chat/dialogs/direct/<ID_BUYER_B>`, `<TOKEN_BUYER_B>`<br>5. `POST /chat/dialogs/direct/<RANDOM_UUID>`, `<TOKEN_BUYER_B>` |
| Ожидаемый результат | 1. `200`, `dialog_id`, `sale_car_id: null`, `listing: null`, `request: null`, `counterpart` — `IMPORTER_I`, `unread: 0`<br>2. `200`, тот же `dialog_id`<br>3. `200`, `items[0].kind` = `system`, `text` начинается с `Обращение к поставщику` и заканчивается `по привозу машины.`<br>4–5. `404`, `code: DIALOG_NOT_FOUND` |
| Статус | Not run |
| Фактический результат | |

### TC-CHAT-009 — WebSocket: подключение по токену и доставка сообщения

| Поле | Значение |
|---|---|
| ID | TC-CHAT-009 |
| Название | Живой канал принимает access-токен в query и отдаёт кадр `message`; без токена закрывается кодом 4403 |
| История | 11 — Чат и непрочитанные |
| Описание | Браузерный WebSocket не шлёт заголовки, поэтому токен идёт параметром; негодное соединение закрывается, а не молчит |
| Приоритет | High |
| Предусловия | ДИАЛОГ_AB; клиент WebSocket (`wscat`, Postman) |
| Тестовые данные | `ws://localhost:8000/api/v1/chat/ws?token=<TOKEN_SELLER_A>` |
| Шаги | 1. Подключиться к `ws://localhost:8000/api/v1/chat/ws` без `token`<br>2. Подключиться с `?token=<REFRESH_TOKEN_SELLER_A>` (refresh, не access)<br>3. Подключиться с `?token=<TOKEN_SELLER_A>`; кадры от клиента не нужны<br>4. Не закрывая соединение: `POST /chat/dialogs/<DIALOG_ID>/messages`, `<TOKEN_BUYER_B>`, тело `{"text": "Через канал"}` |
| Ожидаемый результат | 1–2. Соединение закрыто сервером с кодом `4403` до приёма<br>3. Соединение принято, кадров нет<br>4. HTTP `201`; в сокет пришёл JSON-кадр `{"type": "message", "message": {"message_id", "dialog_id": "<DIALOG_ID>", "author_id", "kind": "text", "text": "Через канал", "read_at": null, "created_at"}}` |
| Статус | Not run |
| Фактический результат | |
