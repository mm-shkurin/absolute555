# Роли и заявки на роль

Подача заявки на роль, очередь заявок, решение по заявке с выдачей роли, прямая смена
роли администратором, карточка роли и статистика. Все ручки смонтированы под `/role`.
Окружение, учётные записи и формат ошибки — в [README.md](README.md).

### TC-ROLE-001 — Пользователь подаёт заявку на роль importer

| Поле | Значение |
|---|---|
| ID | TC-ROLE-001 |
| Название | Заявка создаётся со статусом pending и видна автору |
| История | 13 — Роли и заявки |
| Описание | Основной сценарий: обычный пользователь просит роль поставщика. |
| Приоритет | High |
| Предусловия | `SELLER_A` (`user`, `is_guest=false`), у него нет живой заявки на `importer` |
| Тестовые данные | `{"requested_role": "importer", "reason": "вожу машины из Японии"}` |
| Шаги | 1. `POST /role/role-request`, `Authorization: Bearer <TOKEN_SELLER_A>`, `Content-Type: application/json`, тело из данных<br>2. `GET /role/my-role-requests`, `Authorization: Bearer <TOKEN_SELLER_A>` |
| Ожидаемый результат | 1. `201`; `requested_role` = `importer`, `status` = `pending`, есть `id`, `user_id`, `created_at`, `updated_at`<br>2. `200`; массив содержит заявку с `id` из шага 1 |
| Статус | Not run |
| Фактический результат | |

### TC-ROLE-002 — Повторная заявка на ту же роль отклоняется

| Поле | Значение |
|---|---|
| ID | TC-ROLE-002 |
| Название | Вторая живая заявка на ту же роль — 409 DUPLICATE_ROLE_REQUEST |
| История | 13 — Роли и заявки |
| Описание | На одну роль одновременно ждёт решения только одна заявка. |
| Приоритет | Medium |
| Предусловия | Выполнен TC-ROLE-001, заявка `SELLER_A` в статусе `pending` |
| Тестовые данные | `{"requested_role": "importer", "reason": "ещё раз"}` |
| Шаги | 1. `POST /role/role-request`, `Authorization: Bearer <TOKEN_SELLER_A>`, тело из данных |
| Ожидаемый результат | 1. `409`; `code` = `DUPLICATE_ROLE_REQUEST` |
| Статус | Not run |
| Фактический результат | |

### TC-ROLE-003 — Гость и неавторизованный не подают заявку

| Поле | Значение |
|---|---|
| ID | TC-ROLE-003 |
| Название | Гостю — 403 GUEST_FORBIDDEN, без токена — отказ |
| История | 13 — Роли и заявки |
| Описание | Гость не имеет профиля и заявок не подаёт. |
| Приоритет | High |
| Предусловия | `GUEST_G` (`is_guest=true`) |
| Тестовые данные | `{"requested_role": "importer", "reason": "x"}` |
| Шаги | 1. `POST /role/role-request`, `Authorization: Bearer <TOKEN_GUEST_G>`, тело из данных<br>2. `POST /role/role-request` без заголовка `Authorization`, то же тело |
| Ожидаемый результат | 1. `403`; `code` = `GUEST_FORBIDDEN`<br>2. `401` (`UNAUTHENTICATED`); автотест допускает 401 или 403 |
| Статус | Not run |
| Фактический результат | |

### TC-ROLE-004 — Модератор одобряет заявку, роль выдаётся

| Поле | Значение |
|---|---|
| ID | TC-ROLE-004 |
| Название | Одобрение переводит заявку в approved и меняет роль заявителя |
| История | 13 — Роли и заявки |
| Описание | Решение и выдача роли происходят в одной транзакции. |
| Приоритет | High |
| Предусловия | `BUYER_B` (`user`) подал заявку на `importer`, её `id` = `<REQUEST_ID>`; `MODERATOR_M`, `ADMIN_X` |
| Тестовые данные | `{"status": "approved"}` |
| Шаги | 1. `GET /role/role-requests?status=pending`, `Authorization: Bearer <TOKEN_MODERATOR_M>`<br>2. `PUT /role/role-requests/<REQUEST_ID>`, `Authorization: Bearer <TOKEN_MODERATOR_M>`, тело из данных<br>3. `GET /role/users/<BUYER_B_ID>/role-info`, `Authorization: Bearer <TOKEN_ADMIN_X>` |
| Ожидаемый результат | 1. `200`; в массиве заявка с `id`, `user_id`, `user_name`, `requested_role`=`importer`, `status`=`pending`<br>2. `200`; `status` = `approved`, `reviewed_by` = id модератора, `reviewed_at` заполнен<br>3. `200`; `current_role` = `importer` |
| Статус | Not run |
| Фактический результат | |

### TC-ROLE-005 — Отказ без причины не принимается

| Поле | Значение |
|---|---|
| ID | TC-ROLE-005 |
| Название | Отклонение без review_comment — 422 REJECTION_WITHOUT_REASON |
| История | 13 — Роли и заявки |
| Описание | Отказ должен давать человеку то, что можно исправить; заявка остаётся pending. |
| Приоритет | Medium |
| Предусловия | Заявка `<REQUEST_ID>` в `pending`; `MODERATOR_M` |
| Тестовые данные | `{"status": "rejected"}`; затем `{"status": "rejected", "review_comment": "не хватает документов"}` |
| Шаги | 1. `PUT /role/role-requests/<REQUEST_ID>`, `Authorization: Bearer <TOKEN_MODERATOR_M>`, тело `{"status": "rejected"}`<br>2. `PUT /role/role-requests/<REQUEST_ID>`, тот же заголовок, тело с `review_comment` |
| Ожидаемый результат | 1. `422`; `code` = `REJECTION_WITHOUT_REASON`, `details.field` = `review_comment`<br>2. `200`; `status` = `rejected`, `review_comment` = `не хватает документов`; роль заявителя не изменилась |
| Статус | Not run |
| Фактический результат | |

### TC-ROLE-006 — Решённую заявку нельзя решить повторно

| Поле | Значение |
|---|---|
| ID | TC-ROLE-006 |
| Название | Повторное решение — 409 ROLE_REQUEST_DECIDED |
| История | 13 — Роли и заявки |
| Описание | Решение принимается один раз, иначе отказ можно тихо превратить в одобрение. |
| Приоритет | High |
| Предусловия | Заявка `<REQUEST_ID>` уже в `rejected` (TC-ROLE-005) |
| Тестовые данные | `{"status": "approved"}` |
| Шаги | 1. `PUT /role/role-requests/<REQUEST_ID>`, `Authorization: Bearer <TOKEN_MODERATOR_M>`, тело из данных |
| Ожидаемый результат | 1. `409`; `code` = `ROLE_REQUEST_DECIDED`, `details.current_status` = `rejected`; роль заявителя осталась `user` |
| Статус | Not run |
| Фактический результат | |

### TC-ROLE-007 — Модератор не выдаёт роль своего уровня и выше

| Поле | Значение |
|---|---|
| ID | TC-ROLE-007 |
| Название | Одобрение заявки на admin модератором — 403 ROLE_ABOVE_REVIEWER |
| История | 13 — Роли и заявки |
| Описание | Модератор выдаёт только `user` и `importer`; `manager`/`admin` — только администратор. |
| Приоритет | High |
| Предусловия | `SELLER_A` подал заявку `{"requested_role": "admin", "reason": "хочу всё"}`, `id` = `<REQUEST_ID>` |
| Тестовые данные | `{"status": "approved"}` |
| Шаги | 1. `PUT /role/role-requests/<REQUEST_ID>`, `Authorization: Bearer <TOKEN_MODERATOR_M>`, тело из данных<br>2. `PUT /role/role-requests/<REQUEST_ID>`, `Authorization: Bearer <TOKEN_ADMIN_X>`, то же тело |
| Ожидаемый результат | 1. `403`; `code` = `ROLE_ABOVE_REVIEWER`; роль не изменилась<br>2. `200`; `status` = `approved`, роль `SELLER_A` стала `admin` (верните `user` после кейса) |
| Статус | Not run |
| Фактический результат | |

### TC-ROLE-008 — Обычный пользователь не видит очередь и не решает

| Поле | Значение |
|---|---|
| ID | TC-ROLE-008 |
| Название | Очередь, решение, статистика и role-info закрыты для роли user |
| История | 13 — Роли и заявки |
| Описание | Права `view_role_requests`, `manage_role_requests`, `view_analytics`, `view_users` у `user` нет. |
| Приоритет | High |
| Предусловия | `BUYER_B` (`user`); любая заявка `<REQUEST_ID>` |
| Тестовые данные | `{"status": "approved"}` |
| Шаги | 1. `GET /role/role-requests`, `Authorization: Bearer <TOKEN_BUYER_B>`<br>2. `PUT /role/role-requests/<REQUEST_ID>`, тот же заголовок, тело из данных<br>3. `GET /role/stats`, тот же заголовок<br>4. `GET /role/users/<SELLER_A_ID>/role-info`, тот же заголовок<br>5. `GET /role/stats` без `Authorization` |
| Ожидаемый результат | 1–4. `403`; `code` = `PERMISSION_DENIED`, `details.required` — имя права<br>5. `401`; `code` = `UNAUTHENTICATED` |
| Статус | Not run |
| Фактический результат | |

### TC-ROLE-009 — Администратор меняет роль напрямую, модератор — нет

| Поле | Значение |
|---|---|
| ID | TC-ROLE-009 |
| Название | PUT /role/users/{id}/role: admin — 200, manager — 403, неизвестный id — 404 |
| История | 13 — Роли и заявки; 23 — Консоль администратора |
| Описание | Раздача ролей — только `manage_all_users` (admin); причина пишется в журнал. |
| Приоритет | High |
| Предусловия | `ADMIN_X`, `MODERATOR_M`, `BUYER_B` (`user`) |
| Тестовые данные | `{"new_role": "importer", "reason": "проверка QA"}`; несуществующий `00000000-0000-0000-0000-000000000000` |
| Шаги | 1. `PUT /role/users/<BUYER_B_ID>/role`, `Authorization: Bearer <TOKEN_MODERATOR_M>`, тело из данных<br>2. `PUT /role/users/<BUYER_B_ID>/role`, `Authorization: Bearer <TOKEN_ADMIN_X>`, то же тело<br>3. `GET /role/users/<BUYER_B_ID>/role-info`, `Authorization: Bearer <TOKEN_ADMIN_X>`<br>4. `PUT /role/users/00000000-0000-0000-0000-000000000000/role`, `Authorization: Bearer <TOKEN_ADMIN_X>`, то же тело |
| Ожидаемый результат | 1. `403`; `code` = `PERMISSION_DENIED`<br>2. `200`; `message`, `user_id`, `new_role` = `importer`, `reason` = `проверка QA`, `note`<br>3. `200`; `user_id`, `current_role` = `importer`, `is_verified`<br>4. `404`; `code` = `USER_NOT_FOUND`. Верните `BUYER_B` роль `user` |
| Статус | Not run |
| Фактический результат | |

### TC-ROLE-010 — Статистика ролей для модератора

| Поле | Значение |
|---|---|
| ID | TC-ROLE-010 |
| Название | GET /role/stats отдаёт итог и разбивку по ролям |
| История | 13 — Роли и заявки |
| Описание | Счётчики для модератора; сумма разбивки равна итогу. |
| Приоритет | Low |
| Предусловия | `MODERATOR_M` |
| Тестовые данные | — |
| Шаги | 1. `GET /role/stats`, `Authorization: Bearer <TOKEN_MODERATOR_M>` |
| Ожидаемый результат | 1. `200`; `total_users` ≥ 1, `users_by_role` — объект, сумма его значений = `total_users`; есть `verified_users`, `unverified_users` |
| Статус | Not run |
| Фактический результат | |
