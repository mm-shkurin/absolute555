# Консоль администратора

Список людей страницей с фильтрами, карточка учётной записи, журнал действий, блокировка
и разблокировка, отметка ушедших. Ручки смонтированы под `/role`: список, карточку и
блокировку открывает `manager`, журнал — только `admin`. Окружение, учётные записи и
формат ошибки — в [README.md](README.md).

### TC-ADM-001 — GET /role/users возвращает страницу и фильтруется

| Поле | Значение |
|---|---|
| ID | TC-ADM-001 |
| Название | GET /role/users возвращает страницу и фильтруется |
| История | 23 — Админка: люди, карточка, журнал, блокировка |
| Описание | Список не читает всю таблицу; фильтры по имени, роли, блокировке. |
| Приоритет | High |
| Предусловия | `ADMIN_X`, `MODERATOR_M`; в базе ≥ 3 учётных записей |
| Тестовые данные | `page=1&page_size=2`; `role=admin`; `blocked=true` |
| Шаги | 1. `GET /role/users?page=1&page_size=2`, `Authorization: Bearer <TOKEN_MODERATOR_M>`<br>2. `GET /role/users?role=admin`, `Authorization: Bearer <TOKEN_ADMIN_X>`<br>3. `GET /role/users?blocked=true`, `Authorization: Bearer <TOKEN_ADMIN_X>` |
| Ожидаемый результат | 1. `200`; `items` ≤ 2 элементов (`id`, `role`, `is_verified`, `is_blocked`, `created_at`, `name`, `avatar_url`, `platform`, `deleted_at`), `total` ≥ длины `items`, `page`=1, `page_size`=2<br>2. `200`; у всех `items` `role` = `admin`<br>3. `200`; у всех `items` `is_blocked` = `true` |
| Статус | Not run |
| Фактический результат | |

### TC-ADM-002 — page < 1 или page_size вне 1..100 — 422

| Поле | Значение |
|---|---|
| ID | TC-ADM-002 |
| Название | page < 1 или page_size вне 1..100 — 422 |
| История | 23 — Админка: люди, карточка, журнал, блокировка |
| Описание | Параметры страницы проверяются схемой запроса. |
| Приоритет | Low |
| Предусловия | `MODERATOR_M` |
| Тестовые данные | `page=0`; `page_size=0`; `page_size=101` |
| Шаги | 1. `GET /role/users?page=0`, `Authorization: Bearer <TOKEN_MODERATOR_M>`<br>2. `GET /role/users?page_size=0`, тот же заголовок<br>3. `GET /role/users?page_size=101`, тот же заголовок |
| Ожидаемый результат | 1–3. `422`; `code` = `VALIDATION_ERROR` |
| Статус | Not run |
| Фактический результат | |

### TC-ADM-003 — GET /role/users/{id} — карточка со счётчиками; неизвестный id — 404

| Поле | Значение |
|---|---|
| ID | TC-ADM-003 |
| Название | GET /role/users/{id} — карточка со счётчиками; неизвестный id — 404 |
| История | 23 — Админка: люди, карточка, журнал, блокировка |
| Описание | Модератор судит по карточке: роль, блокировка, объявления, жалобы. |
| Приоритет | High |
| Предусловия | `MODERATOR_M`; `BUYER_B` без объявлений и жалоб |
| Тестовые данные | несуществующий id `00000000-0000-0000-0000-000000000000` |
| Шаги | 1. `GET /role/users/<BUYER_B_ID>`, `Authorization: Bearer <TOKEN_MODERATOR_M>`<br>2. `GET /role/users/00000000-0000-0000-0000-000000000000`, тот же заголовок |
| Ожидаемый результат | 1. `200`; `role`=`user`, `is_blocked`=`false`, `listings_total`=0, `complaints_total`=0, `deleted_at`=`null`; есть `blocked_reason`, `blocked_at`, `created_at`, `name`, `platform`<br>2. `404`; `code` = `USER_NOT_FOUND` |
| Статус | Not run |
| Фактический результат | |

### TC-ADM-004 — После block запросы пользователя — 403 USER_BLOCKED; журнал хранит причину

| Поле | Значение |
|---|---|
| ID | TC-ADM-004 |
| Название | После block запросы пользователя — 403 USER_BLOCKED; журнал хранит причину |
| История | 23 — Админка: люди, карточка, журнал, блокировка |
| Описание | Токен на руках перестаёт работать, отказ называет блокировку; действие пишется в журнал. |
| Приоритет | High |
| Предусловия | `ADMIN_X`; `SELLER_A` не заблокирован |
| Тестовые данные | `{"reason": "накрутка отзывов"}` |
| Шаги | 1. `POST /role/users/<SELLER_A_ID>/block`, `Authorization: Bearer <TOKEN_ADMIN_X>`, `Content-Type: application/json`, тело из данных<br>2. `GET /user/profile`, `Authorization: Bearer <TOKEN_SELLER_A>`<br>3. `GET /role/users/<SELLER_A_ID>/audit`, `Authorization: Bearer <TOKEN_ADMIN_X>` |
| Ожидаемый результат | 1. `200`; `id`, `is_blocked`=`true`, `blocked_reason`=`накрутка отзывов`, `blocked_at` заполнен<br>2. `403`; `code` = `USER_BLOCKED`<br>3. `200`; первый (новейший) элемент: `action`=`blocked`, `reason`=`накрутка отзывов`, `actor_id` = id `ADMIN_X`, есть `actor_name`, `created_at` |
| Статус | Not run |
| Фактический результат | |

### TC-ADM-005 — unblock — 200, профиль снова доступен; повтор — 409 ACCESS_UNCHANGED

| Поле | Значение |
|---|---|
| ID | TC-ADM-005 |
| Название | unblock — 200, профиль снова доступен; повтор — 409 ACCESS_UNCHANGED |
| История | 23 — Админка: люди, карточка, журнал, блокировка |
| Описание | Возврат доступа; действие, не меняющее состояния, отклоняется. |
| Приоритет | High |
| Предусловия | `SELLER_A` заблокирован (TC-ADM-004) |
| Тестовые данные | `{"reason": "разобрались, ошибка"}` |
| Шаги | 1. `POST /role/users/<SELLER_A_ID>/unblock`, `Authorization: Bearer <TOKEN_ADMIN_X>`, тело из данных<br>2. `GET /user/profile`, `Authorization: Bearer <TOKEN_SELLER_A>`<br>3. `POST /role/users/<SELLER_A_ID>/unblock`, `Authorization: Bearer <TOKEN_ADMIN_X>`, тело из данных |
| Ожидаемый результат | 1. `200`; `is_blocked`=`false`, `blocked_reason`=`null`, `blocked_at`=`null`<br>2. `200`<br>3. `409`; `code` = `ACCESS_UNCHANGED` |
| Статус | Not run |
| Фактический результат | |

### TC-ADM-006 — reason="" — 422; повторный block — 409; block самого себя — 409

| Поле | Значение |
|---|---|
| ID | TC-ADM-006 |
| Название | reason="" — 422; повторный block — 409; block самого себя — 409 |
| История | 23 — Админка: люди, карточка, журнал, блокировка |
| Описание | Причина обязательна; блокировать себя нельзя, иначе площадка останется без администратора. |
| Приоритет | Medium |
| Предусловия | `ADMIN_X`; `BUYER_B` не заблокирован |
| Тестовые данные | `{"reason": ""}`; `{"reason": "спам"}` |
| Шаги | 1. `POST /role/users/<BUYER_B_ID>/block`, `Authorization: Bearer <TOKEN_ADMIN_X>`, тело `{"reason": ""}`<br>2. `POST /role/users/<BUYER_B_ID>/block`, тот же заголовок, тело `{"reason": "спам"}`<br>3. `POST /role/users/<BUYER_B_ID>/block`, `Authorization: Bearer <TOKEN_ADMIN_X>`, тело `{"reason": "спам"}`<br>4. `POST /role/users/<ADMIN_X_ID>/block`, тот же заголовок, тело `{"reason": "спам"}` |
| Ожидаемый результат | 1. `422`; `code` = `VALIDATION_ERROR`; `BUYER_B` не заблокирован<br>2. `200`; `is_blocked`=`true`<br>3. `409`; `code` = `ACCESS_UNCHANGED`<br>4. `409`; `code` = `ACCESS_UNCHANGED`. Разблокируйте `BUYER_B` после кейса |
| Статус | Not run |
| Фактический результат | |

### TC-ADM-007 — manager блокирует manager/admin — 403 PERMISSION_DENIED

| Поле | Значение |
|---|---|
| ID | TC-ADM-007 |
| Название | manager блокирует manager/admin — 403 PERMISSION_DENIED |
| История | 23 — Админка: люди, карточка, журнал, блокировка |
| Описание | Ручка разбора жалоб не должна становиться оружием против своих. |
| Приоритет | High |
| Предусловия | `MODERATOR_M`; второй модератор `<PEER_ID>` (роль `manager`); `ADMIN_X` |
| Тестовые данные | `{"reason": "проверка"}` |
| Шаги | 1. `POST /role/users/<PEER_ID>/block`, `Authorization: Bearer <TOKEN_MODERATOR_M>`, тело из данных<br>2. `POST /role/users/<ADMIN_X_ID>/block`, тот же заголовок и тело |
| Ожидаемый результат | 1–2. `403`; `code` = `PERMISSION_DENIED`; оба остаются незаблокированными |
| Статус | Not run |
| Фактический результат | |

### TC-ADM-008 — audit для manager — 403; список, карточка, блокировка для user — 403; без токена — 401

| Поле | Значение |
|---|---|
| ID | TC-ADM-008 |
| Название | audit для manager — 403; список, карточка, блокировка для user — 403; без токена — 401 |
| История | 23 — Админка: люди, карточка, журнал, блокировка |
| Описание | Право `view_account_audit` есть только у admin; у `user` нет прав консоли. |
| Приоритет | High |
| Предусловия | `MODERATOR_M`, `SELLER_A` (`user`), `BUYER_B` |
| Тестовые данные | `{"reason": "x"}` |
| Шаги | 1. `GET /role/users/<BUYER_B_ID>/audit`, `Authorization: Bearer <TOKEN_MODERATOR_M>`<br>2. `GET /role/users`, `Authorization: Bearer <TOKEN_SELLER_A>`<br>3. `GET /role/users/<BUYER_B_ID>`, тот же заголовок<br>4. `POST /role/users/<BUYER_B_ID>/block`, тот же заголовок, тело из данных<br>5. `GET /role/users` без `Authorization` |
| Ожидаемый результат | 1–4. `403`; `code` = `PERMISSION_DENIED`<br>5. `401`; `code` = `UNAUTHENTICATED` |
| Статус | Not run |
| Фактический результат | |

### TC-ADM-009 — Второй admin после блокировки получает 403 на /role/users

| Поле | Значение |
|---|---|
| ID | TC-ADM-009 |
| Название | Второй admin после блокировки получает 403 на /role/users |
| История | 23 — Админка: люди, карточка, журнал, блокировка |
| Описание | Скомпрометированная учётная запись с высокой ролью закрывается сразу. |
| Приоритет | High |
| Предусловия | `ADMIN_X`; вторая учётная запись `ADMIN_2` (`device_id` `qa-admin-2`, роль `admin` через SQL) |
| Тестовые данные | `{"reason": "скомпрометирован"}` |
| Шаги | 1. `POST /role/users/<ADMIN_2_ID>/block`, `Authorization: Bearer <TOKEN_ADMIN_X>`, тело из данных<br>2. `GET /role/users`, `Authorization: Bearer <TOKEN_ADMIN_2>` |
| Ожидаемый результат | 1. `200`; `is_blocked`=`true`<br>2. `403`; `code` = `USER_BLOCKED` |
| Статус | Not run |
| Фактический результат | |

### TC-ADM-010 — deleted_at в карточке, фильтр deleted, block ушедшего — 409

| Поле | Значение |
|---|---|
| ID | TC-ADM-010 |
| Название | deleted_at в карточке, фильтр deleted, block ушедшего — 409 |
| История | 24 — Админка: ушедший человек в консоли |
| Описание | Модератор видит, что человека нет; журнал не получает фиктивной блокировки. |
| Приоритет | Medium |
| Предусловия | Одноразовая запись `QA_GONE` (`device_id` `qa-gone-1`, роль `user`, `is_guest=false`), её id = `<GONE_ID>`; `MODERATOR_M` |
| Тестовые данные | `{"reason": "проверка"}` |
| Шаги | 1. `DELETE /user`, `Authorization: Bearer <TOKEN_QA_GONE>`<br>2. `GET /role/users/<GONE_ID>`, `Authorization: Bearer <TOKEN_MODERATOR_M>`<br>3. `GET /role/users?deleted=true&page_size=100`, тот же заголовок<br>4. `GET /role/users?deleted=false&page_size=100`, тот же заголовок<br>5. `POST /role/users/<GONE_ID>/block`, тот же заголовок, тело из данных |
| Ожидаемый результат | 1. `204`<br>2. `200`; `deleted_at` заполнен<br>3. `200`; `<GONE_ID>` есть в `items`<br>4. `200`; `<GONE_ID>` нет в `items`<br>5. `409`; `code` = `ACCESS_UNCHANGED` |
| Статус | Not run |
| Фактический результат | |
