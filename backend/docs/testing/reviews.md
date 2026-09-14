# Отзывы и рейтинг продавца

Проверки отзыва о продавце: по принятому предложению (`POST /offer/{offer_id}/review`),
по переписке (`POST /chat/dialogs/{dialog_id}/review`), правка в течение 24 часов
(`PATCH /review/{review_id}`) и публичный профиль продавца (`/seller/{user_id}`).
Роутер отзывов смонтирован без префикса, профиль — под `/seller`. Окружение, учётные
записи и формат ошибки — в [README.md](README.md).

Общая подготовка **СДЕЛКА_AB**: `SELLER_A` создаёт объявление по TC-LST-001 (listings-1.md),
объявление опубликовано; `BUYER_B` делает предложение `POST /offer/`
`{"sale_car_id": "<SALE_CAR_ID>", "price": 900000.0}` → `201`, `<OFFER_ID>`; `SELLER_A`
принимает его `PATCH /offer/<OFFER_ID>/status` `{"status": "accepted"}` → `200` (см. offers.md).
`<ID_SELLER_A>` — поле `id` из `GET /user/profile`.

### TC-REV-001 — Покупатель оставляет отзыв после принятого предложения

| Поле | Значение |
|---|---|
| ID | TC-REV-001 |
| Название | Отзыв по сделке: 201, рейтинг продавца пересчитан |
| История | 12 — Рейтинг продавца |
| Описание | Отзыв следует только за закрытой сделкой; агрегат продавца пишется в той же транзакции |
| Приоритет | High |
| Предусловия | СДЕЛКА_AB; у `SELLER_A` нет отзывов |
| Тестовые данные | `{"rating": 4, "text": "Машина как в объявлении"}` |
| Шаги | 1. `POST /offer/<OFFER_ID>/review`, `Authorization: Bearer <TOKEN_BUYER_B>`, `Content-Type: application/json`, тело из тестовых данных<br>2. `GET /seller/<ID_SELLER_A>` без авторизации<br>3. `GET /seller/<ID_SELLER_A>/reviews` без авторизации |
| Ожидаемый результат | 1. `201`, `{review_id, offer_id: <OFFER_ID>, dialog_id: null, seller_id: <ID_SELLER_A>, author: {...}, rating: 4, text: "Машина как в объявлении", created_at, updated_at, editable_until}`; `editable_until` = `created_at` + 24 ч<br>2. `200`, `rating: 4.0`, `reviews_count: 1`<br>3. `200`, `{items, total: 1, page: 1, size: 20}`, `items[0].review_id` из шага 1 |
| Статус | Not run |
| Фактический результат | |

### TC-REV-002 — Второй отзыв на ту же сделку

| Поле | Значение |
|---|---|
| ID | TC-REV-002 |
| Название | Повторный отзыв — 409 `REVIEW_ALREADY_WRITTEN` с `review_id` |
| История | 12 — Рейтинг продавца |
| Описание | Одна сделка — один отзыв; идентификатор в отказе позволяет экрану перейти к правке |
| Приоритет | High |
| Предусловия | Выполнен TC-REV-001 (`<REVIEW_ID>`) |
| Тестовые данные | `{"rating": 1}` |
| Шаги | 1. `POST /offer/<OFFER_ID>/review`, `Authorization: Bearer <TOKEN_BUYER_B>`, тело из тестовых данных<br>2. `GET /seller/<ID_SELLER_A>` |
| Ожидаемый результат | 1. `409`, `code: REVIEW_ALREADY_WRITTEN`, `details: {"review_id": "<REVIEW_ID>"}`<br>2. `reviews_count` не изменился, `rating` прежний |
| Статус | Not run |
| Фактический результат | |

### TC-REV-003 — Отзыв без принятой сделки

| Поле | Значение |
|---|---|
| ID | TC-REV-003 |
| Название | Предложение не принято — 409 `DEAL_NOT_CLOSED` |
| История | 12 — Рейтинг продавца |
| Описание | Рейтинг нельзя поднять без сделки |
| Приоритет | High |
| Предусловия | Объявление `SELLER_A` опубликовано; `BUYER_B` сделал предложение (`<PENDING_OFFER_ID>`), продавец его не принял |
| Тестовые данные | `{"rating": 5}` |
| Шаги | 1. `POST /offer/<PENDING_OFFER_ID>/review`, `Authorization: Bearer <TOKEN_BUYER_B>`, тело из тестовых данных |
| Ожидаемый результат | 1. `409`, `code: DEAL_NOT_CLOSED`, `details: {"current_status": "<текущий статус предложения>"}`; `reviews_count` продавца не изменился |
| Статус | Not run |
| Фактический результат | |

### TC-REV-004 — Чужое, несуществующее и некорректное предложение

| Поле | Значение |
|---|---|
| ID | TC-REV-004 |
| Название | Не автор предложения — 404 `OFFER_NOT_REVIEWABLE`; не UUID — 422 `MALFORMED_IDENTIFIER` |
| История | 12 — Рейтинг продавца |
| Описание | Посторонний не должен узнать, что предложение существует; продавец не оценивает сам себя |
| Приоритет | High |
| Предусловия | СДЕЛКА_AB, отзыва по ней нет |
| Тестовые данные | `{"rating": 5}`; `<RANDOM_UUID>` — новый UUID |
| Шаги | 1. `POST /offer/<OFFER_ID>/review`, `Authorization: Bearer <TOKEN_IMPORTER_I>`<br>2. `POST /offer/<OFFER_ID>/review`, `<TOKEN_SELLER_A>`<br>3. `POST /offer/<RANDOM_UUID>/review`, `<TOKEN_BUYER_B>`<br>4. `POST /offer/not-a-uuid/review`, `<TOKEN_BUYER_B>` |
| Ожидаемый результат | 1–3. `404`, `code: OFFER_NOT_REVIEWABLE`<br>4. `422`, `code: MALFORMED_IDENTIFIER`, `details: {"field": "offer_id"}` |
| Статус | Not run |
| Фактический результат | |

### TC-REV-005 — Гость и запрос без токена

| Поле | Значение |
|---|---|
| ID | TC-REV-005 |
| Название | Гость — 403 `GUEST_FORBIDDEN`; без авторизации — 401 |
| История | 12 — Рейтинг продавца |
| Описание | Гость не торгуется, значит, сделки у него нет; пишущие ручки закрыты для анонима |
| Приоритет | High |
| Предусловия | Выполнен TC-REV-001 (`<REVIEW_ID>`) |
| Тестовые данные | `{"rating": 5}` |
| Шаги | 1. `POST /offer/<OFFER_ID>/review`, `Authorization: Bearer <TOKEN_GUEST_G>`<br>2. `PATCH /review/<REVIEW_ID>`, `<TOKEN_GUEST_G>`<br>3. `POST /offer/<OFFER_ID>/review` без `Authorization`<br>4. `PATCH /review/<REVIEW_ID>` без `Authorization` |
| Ожидаемый результат | 1–2. `403`, `code: GUEST_FORBIDDEN`<br>3–4. `401`, `code: UNAUTHENTICATED` |
| Статус | Not run |
| Фактический результат | |

### TC-REV-006 — Оценка вне 1..5 и длинный текст

| Поле | Значение |
|---|---|
| ID | TC-REV-006 |
| Название | `rating` 0, 6, отсутствует; `text` > 2000 — 422 |
| История | 12 — Рейтинг продавца |
| Описание | Оценка обязательна и лежит в 1..5; отзыв без слов допустим |
| Приоритет | Medium |
| Предусловия | СДЕЛКА_AB, отзыва по ней нет |
| Тестовые данные | см. шаги |
| Шаги | 1. `POST /offer/<OFFER_ID>/review`, `<TOKEN_BUYER_B>`, тело `{"rating": 0}`<br>2. То же, `{"rating": 6}`<br>3. То же, `{"text": "без оценки"}`<br>4. То же, `{"rating": 5, "text": "<2001 символ>"}`<br>5. То же, `{"rating": 5}` |
| Ожидаемый результат | 1–4. `422`, `code: VALIDATION_ERROR`; `reviews_count` продавца = 0<br>5. `201`, `text: null` |
| Статус | Not run |
| Фактический результат | |

### TC-REV-007 — Правка отзыва автором и отказ постороннему

| Поле | Значение |
|---|---|
| ID | TC-REV-007 |
| Название | Автор правит в течение суток — 200; не автор — 404 `REVIEW_NOT_FOUND` |
| История | 12 — Рейтинг продавца |
| Описание | Правка меняет только присланные поля и пересчитывает рейтинг; чужой отзыв не виден как существующий. После 24 ч правка даёт `409 REVIEW_EDIT_WINDOW_CLOSED` (`details.hours: 24`) |
| Приоритет | High |
| Предусловия | Выполнен TC-REV-001 (`<REVIEW_ID>`, рейтинг 4, текст задан) |
| Тестовые данные | `{"rating": 5}` |
| Шаги | 1. `PATCH /review/<REVIEW_ID>`, `Authorization: Bearer <TOKEN_BUYER_B>`, тело из тестовых данных<br>2. `GET /seller/<ID_SELLER_A>`<br>3. `PATCH /review/<REVIEW_ID>`, `<TOKEN_IMPORTER_I>`, тело `{"rating": 1}`<br>4. `PATCH /review/not-a-uuid`, `<TOKEN_BUYER_B>`, тело `{"rating": 1}` |
| Ожидаемый результат | 1. `200`, `rating: 5`, `text` прежний, `updated_at` позже, чем в TC-REV-001<br>2. `rating: 5.0`<br>3. `404`, `code: REVIEW_NOT_FOUND`<br>4. `422`, `code: MALFORMED_IDENTIFIER`, `details: {"field": "review_id"}` |
| Статус | Not run |
| Фактический результат | |

### TC-REV-008 — Отзыв по переписке

| Поле | Значение |
|---|---|
| ID | TC-REV-008 |
| Название | Спрашивавший оценивает по диалогу — 201; повтор — 409; продавец — 404 `DIALOG_NOT_REVIEWABLE` |
| История | 12 — Рейтинг продавца (отзыв по чату) |
| Описание | Оценивает только покупатель диалога и только другую сторону; одна переписка — один отзыв |
| Приоритет | High |
| Предусловия | Диалог по предложению `BUYER_B` на объявление `SELLER_A` (`<DIALOG_ID>`, см. chat.md), отзыва по нему нет |
| Тестовые данные | `{"rating": 4}` |
| Шаги | 1. `GET /chat/dialogs`, `<TOKEN_BUYER_B>`<br>2. `POST /chat/dialogs/<DIALOG_ID>/review`, `<TOKEN_BUYER_B>`, тело из тестовых данных<br>3. Повторить шаг 2<br>4. `POST /chat/dialogs/<DIALOG_ID>/review`, `<TOKEN_SELLER_A>`, тело `{"rating": 5}`<br>5. `GET /chat/dialogs`, `<TOKEN_BUYER_B>` |
| Ожидаемый результат | 1. у диалога `can_review: true`, `review_id: null`<br>2. `201`, `dialog_id: <DIALOG_ID>`, `offer_id: null`, `rating: 4`<br>3. `409`, `code: REVIEW_ALREADY_WRITTEN`, `details.review_id` из шага 2<br>4. `404`, `code: DIALOG_NOT_REVIEWABLE`<br>5. `can_review: false`, `review_id` из шага 2 |
| Статус | Not run |
| Фактический результат | |

### TC-REV-009 — Публичный профиль продавца

| Поле | Значение |
|---|---|
| ID | TC-REV-009 |
| Название | Профиль, отзывы и объявления открыты без входа; неизвестный — 404 `SELLER_NOT_FOUND` |
| История | 12 — Рейтинг продавца |
| Описание | Посетитель видит агрегат и опубликованные объявления, но не телефон; черновики не показываются |
| Приоритет | Medium |
| Предусловия | Выполнен TC-REV-001; у `SELLER_A` одно опубликованное объявление и один черновик |
| Тестовые данные | `<RANDOM_UUID>` — новый UUID |
| Шаги | 1. `GET /seller/<ID_SELLER_A>` без авторизации<br>2. `GET /seller/<ID_SELLER_A>/listings` без авторизации<br>3. `GET /seller/<ID_SELLER_A>/reviews?size=51`<br>4. `GET /seller/<RANDOM_UUID>` |
| Ожидаемый результат | 1. `200`, `{user_id, name, avatar_url, rating, reviews_count, deals_count, listings_count: 1, member_since}`, поля телефона нет<br>2. `200`, `{items, total, page: 1, size: 20}`, в `items` только опубликованное объявление<br>3. `422`, `code: VALIDATION_ERROR`<br>4. `404`, `code: SELLER_NOT_FOUND` |
| Статус | Not run |
| Фактический результат | |
