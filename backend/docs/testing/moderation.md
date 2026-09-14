# Модерация

Очередь модерации, счётчики вкладок, одобрение и отклонение объявления, жалобы
покупателей, снятие с публикации и блок «кто решил». Модерация поставщиков
(`/moderation/suppliers`) описана в `supplier-import.md`. Окружение, учётные записи и
формат ошибки — в [README.md](README.md).

Объявление «на модерации» готовится так: `SELLER_A` создаёт и заполняет его по
TC-LST-001 (listings-1.md), прикладывает фото и отправляет на проверку шагом submit из
listings-2.md (`POST /sale_car/{id}/submit`). «Опубликованное» — то же плюс TC-MOD-002.

### TC-MOD-001 — Модератор видит объявление на проверке в очереди и в счётчике

| Поле | Значение |
|---|---|
| ID | TC-MOD-001 |
| Название | Модератор видит объявление на проверке в очереди и в счётчике |
| История | 09 — Модерация: очередь, отклонение с причиной, жалобы |
| Описание | Очередь — рабочий экран модератора; объявление после submit должно попасть во вкладку `waiting`, счётчик `waiting` растёт |
| Приоритет | High |
| Предусловия | `MODERATOR_M`; `SELLER_A` готов отправить заполненное объявление `<SALE_CAR_ID>` |
| Тестовые данные | `tab=waiting`, `size=60` |
| Шаги | 1. `GET /moderation/counts`, `Authorization: Bearer <TOKEN_MODERATOR_M>` — запомнить `waiting`<br>2. `POST /sale_car/<SALE_CAR_ID>/submit`, `Authorization: Bearer <TOKEN_SELLER_A>`<br>3. `GET /moderation/counts`, `Authorization: Bearer <TOKEN_MODERATOR_M>`<br>4. `GET /moderation/queue?tab=waiting&size=60`, `Authorization: Bearer <TOKEN_MODERATOR_M>` (листать `page`, если `total` > 60) |
| Ожидаемый результат | 1, 3: `200`, `{waiting, complained, handled_today}` — целые; в шаге 3 `waiting` на 1 больше<br>2: `200`, `status` = `moderation`<br>4: `200`, `{items, total, page, size}`; в `items` есть строка с `sale_car_id` = `<SALE_CAR_ID>`, `seller` и `submitted_at` присутствуют (не `null`), `open_complaints` = 0; порядок — старые первыми |
| Статус | Not run |
| Фактический результат | |

### TC-MOD-002 — `approve` переводит в `published`; момент решения видит продавец, имя решившего — только модератор

| Поле | Значение |
|---|---|
| ID | TC-MOD-002 |
| Название | `approve` переводит в `published`; момент решения видит продавец, имя решившего — только модератор |
| История | 09 — Модерация: очередь, отклонение с причиной, жалобы; 22 — Кто решил: модератор в выдаче объявления |
| Описание | Продавцу нужен момент решения, но не имя модератора; модератору — оба |
| Приоритет | High |
| Предусловия | Объявление `<SALE_CAR_ID>` в статусе `moderation` |
| Тестовые данные | `<SALE_CAR_ID>` — `sale_car_id` объявления, отправленного `submit` в TC-LST-010 |
| Шаги | 1. `POST /sale_car/<SALE_CAR_ID>/approve`, `Authorization: Bearer <TOKEN_MODERATOR_M>`<br>2. `GET /sale_car/<SALE_CAR_ID>`, `Authorization: Bearer <TOKEN_SELLER_A>`<br>3. `GET /sale_car/<SALE_CAR_ID>`, `Authorization: Bearer <TOKEN_MODERATOR_M>`<br>4. `GET /sale_car/list` без заголовков |
| Ожидаемый результат | 1: `200`, `{sale_car_id, status: "published", updated_at}`<br>2: `200`, `moderation.decided_at` присутствует (не `null`), `moderation.decided_by` = `null`<br>3: `200`, `moderation.decided_by.user_id` присутствует (не `null`), ключ `name` присутствует<br>4: `200`, ни в одной карточке `items[]` нет ключа `moderation`; объявление больше не в `tab=waiting` |
| Статус | Not run |
| Фактический результат | |

### TC-MOD-003 — `reject` с меткой из списка переводит объявление в `rejected` и сохраняет метку

| Поле | Значение |
|---|---|
| ID | TC-MOD-003 |
| Название | `reject` с меткой из списка переводит объявление в `rejected` и сохраняет метку |
| История | 09 — Модерация: очередь, отклонение с причиной, жалобы; 22 — Кто решил: модератор в выдаче объявления |
| Описание | Метка говорит продавцу, что исправить; решение попадает во вкладку `handled_today` решившего модератора |
| Приоритет | High |
| Предусловия | Объявление `<SALE_CAR_ID>` в статусе `moderation` |
| Тестовые данные | `{"label": "too_few_photos", "comment": "переснимите салон"}`. Допустимые `label`: `plate_or_face_visible`, `photos_of_another_car`, `bait_price`, `too_few_photos`, `contacts_in_description` |
| Шаги | 1. `POST /sale_car/<SALE_CAR_ID>/reject`, `Authorization: Bearer <TOKEN_MODERATOR_M>`, `Content-Type: application/json`, тело из данных<br>2. `GET /sale_car/<SALE_CAR_ID>`, `Authorization: Bearer <TOKEN_SELLER_A>`<br>3. `GET /moderation/queue?tab=handled_today&size=60`, `Authorization: Bearer <TOKEN_MODERATOR_M>` |
| Ожидаемый результат | 1: `200`, `status` = `rejected`<br>2: `200`, `status` = `rejected`, `reject_label` = `too_few_photos`, `moderation.decided_at` присутствует (не `null`), `moderation.decided_by` = `null`<br>3: `200`, объявление есть в `items` |
| Статус | Not run |
| Фактический результат | |

### TC-MOD-004 — Без `label` или с неизвестной меткой — `422`, статус не меняется

| Поле | Значение |
|---|---|
| ID | TC-MOD-004 |
| Название | Без `label` или с неизвестной меткой — `422`, статус не меняется |
| История | 09 — Модерация: очередь, отклонение с причиной, жалобы |
| Описание | Метка обязательна и берётся из фиксированного списка |
| Приоритет | Medium |
| Предусловия | Объявление `<SALE_CAR_ID>` в статусе `moderation` |
| Тестовые данные | А: `{"comment": "плохо"}`; Б: `{"label": "ugly_car"}` |
| Шаги | 1. `POST /sale_car/<SALE_CAR_ID>/reject`, `Authorization: Bearer <TOKEN_MODERATOR_M>`, тело А<br>2. То же с телом Б<br>3. `GET /sale_car/<SALE_CAR_ID>`, `Authorization: Bearer <TOKEN_SELLER_A>` |
| Ожидаемый результат | 1, 2: `422`, `code` = `VALIDATION_ERROR`, в `details.errors[]` поле `label`<br>3: `200`, `status` = `moderation` |
| Статус | Not run |
| Фактический результат | |

### TC-MOD-005 — `user` получает `403 PERMISSION_DENIED`, без токена — `401`

| Поле | Значение |
|---|---|
| ID | TC-MOD-005 |
| Название | `user` получает `403 PERMISSION_DENIED`, без токена — `401` |
| История | 09 — Модерация: очередь, отклонение с причиной, жалобы |
| Описание | Очередь — список непроверенного; решения принимает только модератор (`manager`/`admin`) |
| Приоритет | High |
| Предусловия | Опубликованное объявление `<PUB_ID>`; объявление `<MOD_ID>` в статусе `moderation`; открытая жалоба `<COMPLAINT_ID>` |
| Тестовые данные | Тело снятия/отклонения: `{"label": "bait_price"}` |
| Шаги | 1. `GET /moderation/queue`, `Authorization: Bearer <TOKEN_BUYER_B>`<br>2. `GET /moderation/counts`, `Authorization: Bearer <TOKEN_BUYER_B>`<br>3. `GET /moderation/complaints`, `Authorization: Bearer <TOKEN_BUYER_B>`<br>4. `POST /moderation/listings/<PUB_ID>/unpublish`, `Authorization: Bearer <TOKEN_BUYER_B>`, тело<br>5. `POST /moderation/complaints/<COMPLAINT_ID>/dismiss`, `Authorization: Bearer <TOKEN_BUYER_B>`<br>6. `POST /sale_car/<MOD_ID>/reject`, `Authorization: Bearer <TOKEN_BUYER_B>`, тело<br>7. `GET /moderation/queue` без заголовка `Authorization` |
| Ожидаемый результат | 1–3: `403`, `code` = `PERMISSION_DENIED`<br>4–6: `403`; `GET /sale_car/<PUB_ID>` по-прежнему `published`<br>7: `401`, `code` = `UNAUTHENTICATED` |
| Статус | Not run |
| Фактический результат | |

### TC-MOD-006 — Неизвестная вкладка и `size` > 60 — `422`

| Поле | Значение |
|---|---|
| ID | TC-MOD-006 |
| Название | Неизвестная вкладка и `size` > 60 — `422` |
| История | 09 — Модерация: очередь, отклонение с причиной, жалобы |
| Описание | `tab` ∈ `waiting`, `complained`, `handled_today`; `size` от 1 до 60 |
| Приоритет | Low |
| Предусловия | `MODERATOR_M` |
| Тестовые данные | `tab=whatever`; `size=61` |
| Шаги | 1. `GET /moderation/queue?tab=whatever`, `Authorization: Bearer <TOKEN_MODERATOR_M>`<br>2. `GET /moderation/queue?size=61`, `Authorization: Bearer <TOKEN_MODERATOR_M>` |
| Ожидаемый результат | 1, 2: `422`, `code` = `VALIDATION_ERROR` |
| Статус | Not run |
| Фактический результат | |

### TC-MOD-007 — Жалоба создаётся со статусом `open` и видна модератору во вкладке `complained`

| Поле | Значение |
|---|---|
| ID | TC-MOD-007 |
| Название | Жалоба создаётся со статусом `open` и видна модератору во вкладке `complained` |
| История | 09 — Модерация: очередь, отклонение с причиной, жалобы |
| Описание | Любой вошедший может пожаловаться; жалобы группируются по объявлению; сами по себе объявление не снимают |
| Приоритет | High |
| Предусловия | Опубликованное объявление `<PUB_ID>` продавца `SELLER_A` |
| Тестовые данные | `{"reason": "bait_price", "text": "the price in the chat is half a million higher"}`. Допустимые `reason`: `bait_price`, `photos_of_another_car`, `contacts_in_description`, `sold_already`, `other` |
| Шаги | 1. `POST /sale_car/<PUB_ID>/complaints`, `Authorization: Bearer <TOKEN_BUYER_B>`, `Content-Type: application/json`, тело<br>2. `GET /moderation/complaints?status=open&size=60`, `Authorization: Bearer <TOKEN_MODERATOR_M>`<br>3. `GET /moderation/queue?tab=complained&size=60`, `Authorization: Bearer <TOKEN_MODERATOR_M>`<br>4. `GET /sale_car/<PUB_ID>` без заголовков |
| Ожидаемый результат | 1: `201`, `{complaint_id, sale_car_id, author, reason: "bait_price", text, status: "open", created_at, handled_at: null}`<br>2: `200`, группа с `sale_car_id` = `<PUB_ID>`, в `complaints[]` жалоба с `author.user_id`<br>3: `200`, строка `<PUB_ID>` с `open_complaints` = 1<br>4: `200`, `status` = `published` |
| Статус | Not run |
| Фактический результат | |

### TC-MOD-008 — Повторная жалоба и жалоба на своё — 409, на черновик — 404, без токена — 401

| Поле | Значение |
|---|---|
| ID | TC-MOD-008 |
| Название | Повторная жалоба и жалоба на своё — 409, на черновик — 404, без токена — 401 |
| История | 09 — Модерация: очередь, отклонение с причиной, жалобы |
| Описание | Одна жалоба от человека на объявление; на неопубликованное — «не найдено», чтобы не выдать его существование |
| Приоритет | Medium |
| Предусловия | Выполнен TC-MOD-007 (жалоба `BUYER_B` на `<PUB_ID>`); черновик `<DRAFT_ID>` у `SELLER_A` |
| Тестовые данные | Тело как в TC-MOD-007 |
| Шаги | 1. `POST /sale_car/<PUB_ID>/complaints`, `Authorization: Bearer <TOKEN_BUYER_B>`, тело<br>2. `POST /sale_car/<PUB_ID>/complaints`, `Authorization: Bearer <TOKEN_SELLER_A>`, тело<br>3. `POST /sale_car/<DRAFT_ID>/complaints`, `Authorization: Bearer <TOKEN_BUYER_B>`, тело<br>4. `POST /sale_car/<PUB_ID>/complaints` без `Authorization`, тело |
| Ожидаемый результат | 1: `409`, `code` = `ALREADY_COMPLAINED`<br>2: `409`, `code` = `COMPLAINT_ON_OWN_LISTING`<br>3: `404`, `code` = `LISTING_NOT_FOUND`<br>4: `401` |
| Статус | Not run |
| Фактический результат | |

### TC-MOD-009 — `dismiss` закрывает жалобу один раз; объявление остаётся опубликованным

| Поле | Значение |
|---|---|
| ID | TC-MOD-009 |
| Название | `dismiss` закрывает жалобу один раз; объявление остаётся опубликованным |
| История | 09 — Модерация: очередь, отклонение с причиной, жалобы |
| Описание | Модератор не согласен с жалобой; повторное решение и несуществующая жалоба отклоняются |
| Приоритет | Medium |
| Предусловия | Открытая жалоба `<COMPLAINT_ID>` на `<PUB_ID>` |
| Тестовые данные | Случайный UUID `<RANDOM_UUID>` |
| Шаги | 1. `POST /moderation/complaints/<COMPLAINT_ID>/dismiss`, `Authorization: Bearer <TOKEN_MODERATOR_M>`<br>2. `POST /moderation/complaints/<COMPLAINT_ID>/dismiss`, `Authorization: Bearer <TOKEN_MODERATOR_M>`<br>3. `POST /moderation/complaints/<RANDOM_UUID>/dismiss`, `Authorization: Bearer <TOKEN_MODERATOR_M>`<br>4. `GET /sale_car/<PUB_ID>` без заголовков |
| Ожидаемый результат | 1: `200`, `status` = `handled`; жалобы нет в `GET /moderation/complaints?status=open`<br>2: `409`, `code` = `COMPLAINT_ALREADY_HANDLED`<br>3: `404`, `code` = `COMPLAINT_NOT_FOUND`<br>4: `200`, `status` = `published` |
| Статус | Not run |
| Фактический результат | |

### TC-MOD-010 — `unpublish` переводит в `rejected` с меткой и закрывает открытые жалобы

| Поле | Значение |
|---|---|
| ID | TC-MOD-010 |
| Название | `unpublish` переводит в `rejected` с меткой и закрывает открытые жалобы |
| История | 09 — Модерация: очередь, отклонение с причиной, жалобы |
| Описание | Снятие — одно решение: объявление уходит из ленты, продавец видит метку, жалобы закрыты |
| Приоритет | High |
| Предусловия | Опубликованное `<PUB_ID>` с двумя открытыми жалобами; объявление `<MOD_ID>` в статусе `moderation` |
| Тестовые данные | А: `{"label": "bait_price", "comment": "the price is not the price"}`; Б: `{"comment": "без метки"}` |
| Шаги | 1. `POST /moderation/listings/<PUB_ID>/unpublish`, `Authorization: Bearer <TOKEN_MODERATOR_M>`, тело Б<br>2. То же с телом А<br>3. `GET /sale_car/<PUB_ID>`, `Authorization: Bearer <TOKEN_SELLER_A>`<br>4. `GET /moderation/complaints?status=open&size=60`, `Authorization: Bearer <TOKEN_MODERATOR_M>`<br>5. `POST /moderation/listings/<MOD_ID>/unpublish`, `Authorization: Bearer <TOKEN_MODERATOR_M>`, тело А |
| Ожидаемый результат | 1: `422`, `code` = `VALIDATION_ERROR`<br>2: `200`, `{sale_car_id, status: "rejected", updated_at}`<br>3: `200`, `status` = `rejected`, `reject_label` = `bait_price`; нет в `GET /sale_car/list`<br>4: `200`, группы `<PUB_ID>` нет<br>5: `409`, `code` = `TRANSITION_NOT_ALLOWED`, `details.allowed` = `["published"]` |
| Статус | Not run |
| Фактический результат | |
