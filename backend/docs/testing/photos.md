# Галерея фото объявления

Загрузка фотографий в объявление, удаление фото и смена порядка (первое фото — обложка).
Лимиты по умолчанию (`backend/app/core/config.py`, `PhotoSettings`): не больше 15 фото
в галерее (`MAX_PHOTOS_PER_LISTING`), не больше 10 МиБ = 10485760 байт на файл
(`MAX_PHOTO_BYTES`). Добавлять и удалять фото можно только в статусах `draft` и `rejected`;
порядок меняется в любом статусе. Чужое объявление отвечает `404`, а не `403`.
Окружение, учётные записи и формат ошибки — в [README.md](README.md).

Ответ всех трёх ручек (`GalleryResponse`): `{"sale_car_id": "<uuid>", "photos": [{"photo_id", "url", "preview_url"}], "limit": 15}`.
Файлы загружаются `multipart/form-data`, поле формы — `files` (повторяется на каждый файл).

### TC-PHO-001 — Загрузка фото добавляет его в галерею и делает обложкой

| Поле | Значение |
|---|---|
| ID | TC-PHO-001 |
| Название | Первое загруженное фото появляется в галерее и становится обложкой |
| История | 05 — listing-photos |
| Описание | Основной сценарий: продавец добавляет фото, сервер хранит оригинал и уменьшенную копию |
| Приоритет | High |
| Предусловия | `SELLER_A` создал объявление по TC-LST-001 (listings-1.md), статус `draft`, фото нет; `<ID>` — его `sale_car_id` |
| Тестовые данные | `photo1.jpg` — настоящее JPEG-изображение до 10 МиБ |
| Шаги | 1. `POST /sale_car/<ID>/photos`, заголовок `Authorization: Bearer <TOKEN_SELLER_A>`, multipart: `files=@photo1.jpg`<br>2. `GET /sale_car/<ID>`, тот же заголовок |
| Ожидаемый результат | 1. `200`; `photos` из 1 элемента, у него непустые `photo_id`, `url`, `preview_url`; `preview_url` ≠ `url`; `limit` = 15<br>2. `200`; `photos[0].photo_id` совпадает с шагом 1, `preview_photo_url` = `photos[0].preview_url` |
| Статус | Not run |
| Фактический результат | |

### TC-PHO-002 — Смена порядка переносит обложку

| Поле | Значение |
|---|---|
| ID | TC-PHO-002 |
| Название | `PUT .../photos/order` задаёт порядок галереи, обложкой становится первое фото |
| История | 05 — listing-photos |
| Описание | Порядок списка — это порядок показа; отдельного поля обложки нет |
| Приоритет | High |
| Предусловия | Объявление `SELLER_A` в `draft` с 3 фото (`photo1.jpg`…`photo3.jpg`); их `photo_id` по порядку — `<P1>`, `<P2>`, `<P3>` |
| Тестовые данные | `{"photo_ids": ["<P3>", "<P1>", "<P2>"]}` |
| Шаги | 1. `PUT /sale_car/<ID>/photos/order`, `Authorization: Bearer <TOKEN_SELLER_A>`, `Content-Type: application/json`, тело из тестовых данных<br>2. `GET /sale_car/<ID>`, `Authorization: Bearer <TOKEN_SELLER_A>` |
| Ожидаемый результат | 1. `200`; `photos[].photo_id` = `[<P3>, <P1>, <P2>]`<br>2. `200`; `preview_photo_url` = `preview_url` фото `<P3>` |
| Статус | Not run |
| Фактический результат | |

### TC-PHO-003 — Удаление фото закрывает промежуток в порядке

| Поле | Значение |
|---|---|
| ID | TC-PHO-003 |
| Название | Удалённое фото исчезает, остальные сохраняют относительный порядок |
| История | 05 — listing-photos |
| Описание | После удаления обложки обложкой становится следующее фото |
| Приоритет | High |
| Предусловия | Объявление `SELLER_A` в `draft` с 3 фото `<P1>`, `<P2>`, `<P3>` |
| Тестовые данные | удаляется `<P1>` |
| Шаги | 1. `DELETE /sale_car/<ID>/photos/<P1>`, `Authorization: Bearer <TOKEN_SELLER_A>`<br>2. `GET /sale_car/<ID>`, тот же заголовок |
| Ожидаемый результат | 1. `200`; `photos[].photo_id` = `[<P2>, <P3>]`<br>2. `preview_photo_url` = `preview_url` фото `<P2>` |
| Статус | Not run |
| Фактический результат | |

### TC-PHO-004 — Лимит 15 фото в галерее

| Поле | Значение |
|---|---|
| ID | TC-PHO-004 |
| Название | Загрузка сверх 15 фото отклоняется целиком с `409 GALLERY_LIMIT_REACHED` |
| История | 05 — listing-photos |
| Описание | Галерея не переполняется; отказ не добавляет ни одного файла из запроса |
| Приоритет | Medium |
| Предусловия | Объявление `SELLER_A` в `draft` с 14 фото |
| Тестовые данные | `photo15.jpg`, `photo16.jpg`, `photo17.jpg` — валидные изображения; затем `photo15.jpg` отдельно |
| Шаги | 1. `POST /sale_car/<ID>/photos`, `Authorization: Bearer <TOKEN_SELLER_A>`, multipart: `files=@photo15.jpg`, `files=@photo16.jpg`, `files=@photo17.jpg`<br>2. `POST /sale_car/<ID>/photos`, multipart: `files=@photo15.jpg`<br>3. Повторить шаг 2 |
| Ожидаемый результат | 1. `409`; `code` = `GALLERY_LIMIT_REACHED`; `details` = `{"limit": 15, "current": 14, "offered": 3}`; в галерее по-прежнему 14 фото<br>2. `200`; в `photos` 15 элементов<br>3. `409`, `code` = `GALLERY_LIMIT_REACHED` |
| Статус | Not run |
| Фактический результат | |

### TC-PHO-005 — Файл больше лимита размера

| Поле | Значение |
|---|---|
| ID | TC-PHO-005 |
| Название | Файл тяжелее 10485760 байт отклоняется с `413 PHOTO_TOO_LARGE` |
| История | 05 — listing-photos |
| Описание | Размер проверяется по байтам файла до проверки формата |
| Приоритет | Medium |
| Предусловия | Объявление `SELLER_A` в `draft` без фото; `MAX_PHOTO_BYTES` не переопределён |
| Тестовые данные | `photo_big.jpg` размером 11 МиБ (11534336 байт) |
| Шаги | 1. `POST /sale_car/<ID>/photos`, `Authorization: Bearer <TOKEN_SELLER_A>`, multipart: `files=@photo_big.jpg`<br>2. `GET /sale_car/<ID>` |
| Ожидаемый результат | 1. `413`; `code` = `PHOTO_TOO_LARGE`; `details` = `{"limit_bytes": 10485760, "size_bytes": 11534336}`<br>2. `photos` = `[]` |
| Статус | Not run |
| Фактический результат | |

### TC-PHO-006 — Не изображение отклоняется, запрос не применяется частично

| Поле | Значение |
|---|---|
| ID | TC-PHO-006 |
| Название | Файл, не являющийся изображением, даёт `422 NOT_AN_IMAGE`, и ни один файл запроса не сохраняется |
| История | 05 — listing-photos |
| Описание | Формат определяется по содержимому, а не по имени и `Content-Type`; загрузка «всё или ничего» |
| Приоритет | Medium |
| Предусловия | Объявление `SELLER_A` в `draft` с 2 фото |
| Тестовые данные | `good1.png`, `good2.png` — валидные PNG; `bad.jpg` — текстовый файл с содержимым `this is not an image`, отправленный как `image/jpeg` |
| Шаги | 1. `POST /sale_car/<ID>/photos`, `Authorization: Bearer <TOKEN_SELLER_A>`, multipart: `files=@good1.png`, `files=@good2.png`, `files=@bad.jpg;type=image/jpeg`<br>2. `GET /sale_car/<ID>` |
| Ожидаемый результат | 1. `422`; `code` = `NOT_AN_IMAGE`; `details.filename` = `bad.jpg`<br>2. в `photos` по-прежнему 2 фото |
| Статус | Not run |
| Фактический результат | |

### TC-PHO-007 — Галерея заморожена на модерации

| Поле | Значение |
|---|---|
| ID | TC-PHO-007 |
| Название | В статусе `moderation` добавление и удаление фото дают `409 LISTING_FROZEN` |
| История | 05 — listing-photos |
| Описание | Модератор проверяет ровно те фото, что были отправлены |
| Приоритет | Medium |
| Предусловия | Объявление `SELLER_A` заполнено, в нём 3 фото (`<P1>`…), отправлено `POST /sale_car/<ID>/submit` — статус `moderation` (см. listings-2.md) |
| Тестовые данные | `photo4.jpg` — валидное изображение |
| Шаги | 1. `POST /sale_car/<ID>/photos`, `Authorization: Bearer <TOKEN_SELLER_A>`, multipart: `files=@photo4.jpg`<br>2. `DELETE /sale_car/<ID>/photos/<P1>`, тот же заголовок |
| Ожидаемый результат | 1. `409`; `code` = `LISTING_FROZEN`; `details` = `{"current_status": "moderation", "allowed": []}`<br>2. `409`; `code` = `LISTING_FROZEN`; в галерее 3 фото |
| Статус | Not run |
| Фактический результат | |

### TC-PHO-008 — Порядок, не совпадающий с галереей

| Поле | Значение |
|---|---|
| ID | TC-PHO-008 |
| Название | Неполный, чужой или повторяющийся список `photo_ids` даёт `422 ORDER_MISMATCH` |
| История | 05 — listing-photos |
| Описание | Порядок должен быть перестановкой ровно тех фото, что есть в галерее |
| Приоритет | Medium |
| Предусловия | Объявление `SELLER_A` с 3 фото `<P1>`, `<P2>`, `<P3>` |
| Тестовые данные | А: `{"photo_ids": ["<P1>", "<P2>", "a-photo-from-somewhere-else"]}`<br>Б: `{"photo_ids": ["<P1>", "<P1>", "<P2>", "<P3>"]}` |
| Шаги | 1. `PUT /sale_car/<ID>/photos/order`, `Authorization: Bearer <TOKEN_SELLER_A>`, `Content-Type: application/json`, тело А<br>2. То же с телом Б |
| Ожидаемый результат | 1. `422`; `code` = `ORDER_MISMATCH`; `details` = `{"missing": ["<P3>"], "unknown": ["a-photo-from-somewhere-else"]}`; порядок не изменён<br>2. `422`; `code` = `ORDER_MISMATCH`; порядок не изменён |
| Статус | Not run |
| Фактический результат | |

### TC-PHO-009 — Пустая загрузка и несуществующее фото

| Поле | Значение |
|---|---|
| ID | TC-PHO-009 |
| Название | Запрос без файлов даёт `422`, удаление неизвестного `photo_id` — `404 PHOTO_NOT_FOUND` |
| История | 05 — listing-photos |
| Описание | Граничные ошибки ручек галереи |
| Приоритет | Low |
| Предусловия | Объявление `SELLER_A` в `draft` |
| Тестовые данные | `photo_id` = `00000000000000000000000000000000` |
| Шаги | 1. `POST /sale_car/<ID>/photos`, `Authorization: Bearer <TOKEN_SELLER_A>`, multipart без поля `files`<br>2. `DELETE /sale_car/<ID>/photos/00000000000000000000000000000000`, тот же заголовок |
| Ожидаемый результат | 1. `422`; `code` = `NO_FILES_GIVEN` (допустимо `VALIDATION_ERROR`, если клиент не отправил тело multipart)<br>2. `404`; `code` = `PHOTO_NOT_FOUND` |
| Статус | Not run |
| Фактический результат | |

### TC-PHO-010 — Без токена, чужое и несуществующее объявление

| Поле | Значение |
|---|---|
| ID | TC-PHO-010 |
| Название | Без токена — `401`; не владелец и несуществующий `sale_car_id` — одинаковый `404 LISTING_NOT_FOUND` |
| История | 05 — listing-photos |
| Описание | Не владелец не узнаёт, существует ли объявление |
| Приоритет | High |
| Предусловия | Объявление `SELLER_A` в `draft` с 1 фото `<P1>` |
| Тестовые данные | `photo1.jpg`; несуществующий id `11111111-1111-1111-1111-111111111111` |
| Шаги | 1. `POST /sale_car/<ID>/photos` без `Authorization`, multipart: `files=@photo1.jpg`<br>2. `POST /sale_car/<ID>/photos`, `Authorization: Bearer <TOKEN_BUYER_B>`, multipart: `files=@photo1.jpg`<br>3. `DELETE /sale_car/<ID>/photos/<P1>`, `Authorization: Bearer <TOKEN_BUYER_B>`<br>4. `PUT /sale_car/11111111-1111-1111-1111-111111111111/photos/order`, `Authorization: Bearer <TOKEN_SELLER_A>`, тело `{"photo_ids": ["<P1>"]}` |
| Ожидаемый результат | 1. `401`; `code` = `UNAUTHENTICATED`<br>2. `404`; `code` = `LISTING_NOT_FOUND`<br>3. `404`; `code` = `LISTING_NOT_FOUND`; фото `<P1>` на месте<br>4. `404`; `code` = `LISTING_NOT_FOUND` |
| Статус | Not run |
| Фактический результат | |
