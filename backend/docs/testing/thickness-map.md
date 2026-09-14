# Карта толщины ЛКП и распознавание толщиномера

Ручные проверки карты замеров объявления: запись и перезапись замера панели, удаление,
чтение карты покупателем, подсказка числа со снимка прибора, отказы по доступу и
валидации. Тринадцать панелей: `hood`, `roof`, `trunk_lid`, `front_left_door`,
`front_right_door`, `rear_left_door`, `rear_right_door`, `front_left_fender`,
`front_right_fender`, `rear_left_fender`, `rear_right_fender`, `front_bumper`,
`rear_bumper`. Статус считает сервер: `< 200` — `factory`, `200–499` — `repaint`,
`>= 500` — `filler`; допустимое значение `value_um` — от 1 до 3000. История 26 контракт
API не меняла (только схема на фронте). Окружение, учётные записи и формат ошибки —
в [README.md](README.md).

### TC-THK-001 — Продавец записывает замер панели

| Поле | Значение |
|---|---|
| ID | TC-THK-001 |
| Название | Замер капота сохраняется, статус и сводка считаются сервером |
| История | 14 — Карта толщины ЛКП |
| Описание | Основной сценарий: число и фото экрана прибора записываются на панель из пути. |
| Приоритет | High |
| Предусловия | `SELLER_A` создал черновик по TC-LST-001 (listings-1.md), `sale_car_id` = `<LISTING_ID>`; замеров нет. |
| Тестовые данные | multipart: `value_um=120`, `photo` = `gauge.png` (любое PNG-изображение, `image/png`) |
| Шаги | 1. `PUT /sale_car/<LISTING_ID>/thickness/hood`<br>Заголовок: `Authorization: Bearer <TOKEN_SELLER_A>`<br>Тело (multipart/form-data): `value_um=120`, `photo=@gauge.png` |
| Ожидаемый результат | `200`. `sale_car_id` = `<LISTING_ID>`, `measured_panels` = 1, `total_panels` = 13, `is_complete` = false.<br>`measurements[0]`: `panel` = `hood`, `value_um` = 120, `status` = `factory`, `source` = `seller` (если число не совпало с прочитанным со снимка), `photo_url` непустой, есть `ocr_value_um`, `updated_at`. |
| Статус | Not run |
| Фактический результат | |

### TC-THK-002 — Повторная запись перезаписывает панель

| Поле | Значение |
|---|---|
| ID | TC-THK-002 |
| Название | Второй `PUT` на ту же панель не заводит второй замер |
| История | 14 — Карта толщины ЛКП |
| Описание | Панель адресуется путём: запись идемпотентна, одна панель — один замер. |
| Приоритет | Medium |
| Предусловия | Как в TC-THK-001; выполнен шаг TC-THK-001 для панели `roof` с `value_um=120`. |
| Тестовые данные | multipart: `value_um=340`, `photo=@gauge.png` |
| Шаги | 1. `PUT /sale_car/<LISTING_ID>/thickness/roof`<br>Заголовок: `Authorization: Bearer <TOKEN_SELLER_A>`<br>Тело: `value_um=340`, `photo=@gauge.png` |
| Ожидаемый результат | `200`. `measured_panels` = 1; `measurements[0].value_um` = 340, `status` = `repaint`. |
| Статус | Not run |
| Фактический результат | |

### TC-THK-003 — Покупатель видит карту опубликованного объявления, сводка в карточке

| Поле | Значение |
|---|---|
| ID | TC-THK-003 |
| Название | Карта и полоска статусов доступны покупателю |
| История | 14 — Карта толщины ЛКП |
| Описание | Карта видна тем же, кому видно объявление; карточка несёт сводку без отдельного вызова. |
| Приоритет | High |
| Предусловия | Объявление `<LISTING_ID>` продавца `SELLER_A` опубликовано (статус `published`); записан замер `hood` = 110. |
| Тестовые данные | — |
| Шаги | 1. `GET /sale_car/<LISTING_ID>/thickness`<br>Заголовок: `Authorization: Bearer <TOKEN_BUYER_B>`<br>2. `GET /sale_car/<LISTING_ID>` (без заголовка) |
| Ожидаемый результат | 1. `200`, `measurements` содержит ровно одну панель `hood`.<br>2. `200`, `thickness` = `{"measured_panels": 1, "total_panels": 13, "is_complete": false, "panels": ["factory", null × 12]}` — порядок `panels` как в списке панелей выше. |
| Статус | Not run |
| Фактический результат | |

### TC-THK-004 — Карта черновика скрыта от чужого

| Поле | Значение |
|---|---|
| ID | TC-THK-004 |
| Название | Чужой пользователь получает 404 на карту и на запись в чужой черновик |
| История | 14 — Карта толщины ЛКП |
| Описание | Чужое и несуществующее объявление отвечают одинаково `404`, а не `403`: ответ не должен подтверждать, что идентификатор существует. |
| Приоритет | High |
| Предусловия | `SELLER_A` создал черновик `<LISTING_ID>` (TC-LST-001) и записал замер `hood`. |
| Тестовые данные | multipart: `value_um=120`, `photo=@gauge.png` |
| Шаги | 1. `GET /sale_car/<LISTING_ID>/thickness`<br>Заголовок: `Authorization: Bearer <TOKEN_BUYER_B>`<br>2. `PUT /sale_car/<LISTING_ID>/thickness/hood`<br>Заголовок: `Authorization: Bearer <TOKEN_BUYER_B>`<br>Тело: `value_um=120`, `photo=@gauge.png`<br>3. `POST /sale_car/<LISTING_ID>/thickness/read`<br>Заголовок: `Authorization: Bearer <TOKEN_BUYER_B>`<br>Тело: `photo=@gauge.png` |
| Ожидаемый результат | Все шаги: `404`, `code` = `LISTING_NOT_FOUND`. Замер `SELLER_A` не изменился. |
| Статус | Not run |
| Фактический результат | |

### TC-THK-005 — Запись без токена и в несуществующее объявление

| Поле | Значение |
|---|---|
| ID | TC-THK-005 |
| Название | Без авторизации — 401, неизвестный `sale_car_id` — 404 |
| История | 14 — Карта толщины ЛКП |
| Описание | Запись карты требует входа; несуществующее объявление не отличимо от чужого. |
| Приоритет | High |
| Предусловия | Черновик `<LISTING_ID>` у `SELLER_A`. |
| Тестовые данные | Случайный UUID, например `00000000-0000-4000-8000-000000000000`; multipart `value_um=120`, `photo=@gauge.png` |
| Шаги | 1. `PUT /sale_car/<LISTING_ID>/thickness/hood` без `Authorization`, тело `value_um=120`, `photo=@gauge.png`<br>2. `PUT /sale_car/00000000-0000-4000-8000-000000000000/thickness/hood`<br>Заголовок: `Authorization: Bearer <TOKEN_SELLER_A>`<br>Тело: `value_um=120`, `photo=@gauge.png` |
| Ожидаемый результат | 1. `401`, `code` = `CREDENTIALS_INVALID` (автотест допускает 401 или 403).<br>2. `404`, `code` = `LISTING_NOT_FOUND`. |
| Статус | Not run |
| Фактический результат | |

### TC-THK-006 — Неизвестная панель, значение вне диапазона, нет фото

| Поле | Значение |
|---|---|
| ID | TC-THK-006 |
| Название | Невалидный замер отклоняется 422 и не сохраняется |
| История | 14 — Карта толщины ЛКП |
| Описание | Набор панелей фиксирован; 0 и больше 3000 мкм прибор не показывает; фото обязательно. |
| Приоритет | High |
| Предусловия | Черновик `<LISTING_ID>` у `SELLER_A`, замеров нет. |
| Тестовые данные | `panel=spoiler`; `value_um=0`; `value_um=4000`; `photo=@gauge.png`; файл-не-изображение `gauge.txt` (`text/plain`, содержимое `not a photograph`) |
| Шаги | Везде заголовок `Authorization: Bearer <TOKEN_SELLER_A>`.<br>1. `PUT /sale_car/<LISTING_ID>/thickness/spoiler`, тело `value_um=120`, `photo=@gauge.png`<br>2. `PUT /sale_car/<LISTING_ID>/thickness/hood`, тело `value_um=0`, `photo=@gauge.png`<br>3. То же с `value_um=4000`<br>4. `PUT /sale_car/<LISTING_ID>/thickness/hood`, тело только `value_um=120` (без `photo`)<br>5. `PUT /sale_car/<LISTING_ID>/thickness/hood`, тело `value_um=120`, `photo=@gauge.txt`<br>6. `GET /sale_car/<LISTING_ID>/thickness` |
| Ожидаемый результат | 1. `422`, `code` = `VALIDATION_ERROR`.<br>2–3. `422`, `code` = `VALUE_OUT_OF_RANGE`, `details.value_um` = 0 / 4000.<br>4. `422`, `code` = `VALIDATION_ERROR`.<br>5. `422`, `code` = `NOT_AN_IMAGE`.<br>6. `200`, `measured_panels` = 0. |
| Статус | Not run |
| Фактический результат | |

### TC-THK-007 — Полная карта и потеря полноты при удалении

| Поле | Значение |
|---|---|
| ID | TC-THK-007 |
| Название | 13 панелей дают `is_complete` = true, удаление панели снимает флаг |
| История | 14 — Карта толщины ЛКП |
| Описание | Полнота карты — все тринадцать панелей; удаление возвращает обновлённую карту. |
| Приоритет | Medium |
| Предусловия | Черновик `<LISTING_ID>` у `SELLER_A`; по TC-THK-001 записаны все 13 панелей. |
| Тестовые данные | — |
| Шаги | 1. `GET /sale_car/<LISTING_ID>/thickness`, заголовок `Authorization: Bearer <TOKEN_SELLER_A>`<br>2. `DELETE /sale_car/<LISTING_ID>/thickness/hood`, тот же заголовок<br>3. Повторить шаг 2 |
| Ожидаемый результат | 1. `200`, `measured_panels` = 13, `is_complete` = true.<br>2. `200`, `measured_panels` = 12, `is_complete` = false.<br>3. `404`, `code` = `MEASUREMENT_NOT_FOUND`. |
| Статус | Not run |
| Фактический результат | |

### TC-THK-008 — Подсказка числа со снимка прибора без сохранения

| Поле | Значение |
|---|---|
| ID | TC-THK-008 |
| Название | `thickness/read` возвращает число, карта не меняется |
| История | 15 — Распознавание толщиномера |
| Описание | Распознавание ошибается, поэтому число — подсказка для сверки; в карту попадает только по `PUT`. |
| Приоритет | High |
| Предусловия | Черновик `<LISTING_ID>` у `SELLER_A`, замеров нет. Воркер распознавания настроен (в проде — внешний vision-сервис; автотесты подменяют его tesseract). |
| Тестовые данные | `gauge-180.png` — снимок экрана с крупными цифрами `180`; `blank.png` — изображение без цифр |
| Шаги | 1. `POST /sale_car/<LISTING_ID>/thickness/read`<br>Заголовок: `Authorization: Bearer <TOKEN_SELLER_A>`<br>Тело (multipart): поле `photo=@gauge-180.png`<br>2. То же с `photo=@blank.png`<br>3. `GET /sale_car/<LISTING_ID>/thickness`, тот же заголовок |
| Ожидаемый результат | 1. `200`, `{"value_um": 180}`.<br>2. `200`, `{"value_um": null}`.<br>3. `200`, `measurements` = `[]`. |
| Статус | Not run |
| Фактический результат | |

### TC-THK-009 — Источник замера: прибор или продавец

| Поле | Значение |
|---|---|
| ID | TC-THK-009 |
| Название | Без `value_um` или с подтверждённым числом — `ocr`; нечитаемый кадр без числа — 422 |
| История | 15 — Распознавание толщиномера |
| Описание | Покупатель должен видеть, снято число с экрана или вписано; выдумывать число по нечитаемому кадру нельзя. |
| Приоритет | Medium |
| Предусловия | Черновик `<LISTING_ID>` у `SELLER_A`, замеров нет. |
| Тестовые данные | `gauge-180.png`, `blank.png` из TC-THK-008 |
| Шаги | Везде заголовок `Authorization: Bearer <TOKEN_SELLER_A>`.<br>1. `PUT /sale_car/<LISTING_ID>/thickness/hood`, тело `value_um=180`, `photo=@gauge-180.png`<br>2. `PUT /sale_car/<LISTING_ID>/thickness/roof`, тело `value_um=310`, `photo=@gauge-180.png`<br>3. `PUT /sale_car/<LISTING_ID>/thickness/trunk_lid`, тело только `photo=@blank.png` |
| Ожидаемый результат | 1. `200`, у `hood`: `value_um` = 180, `source` = `ocr`.<br>2. `200`, у `roof`: `value_um` = 310, `source` = `seller`, `ocr_value_um` — прочитанное число или null.<br>3. `422`, `code` = `OCR_UNREADABLE`, `details.panel` = `trunk_lid`; панель не записана. |
| Статус | Not run |
| Фактический результат | |

### TC-THK-010 — Правка замера после публикации

| Поле | Значение |
|---|---|
| ID | TC-THK-010 |
| Название | Опубликованное объявление принимает исправление замера |
| История | 14 — Карта толщины ЛКП |
| Описание | Замер — исправляемая опечатка, а не новый материал: запись разрешена в любом статусе. |
| Приоритет | Medium |
| Предусловия | Объявление `<LISTING_ID>` у `SELLER_A` опубликовано; замер `hood` = 110. |
| Тестовые данные | multipart: `value_um=260`, `photo=@gauge.png` |
| Шаги | 1. `PUT /sale_car/<LISTING_ID>/thickness/hood`<br>Заголовок: `Authorization: Bearer <TOKEN_SELLER_A>`<br>Тело: `value_um=260`, `photo=@gauge.png` |
| Ожидаемый результат | `200`, `measurements[0].value_um` = 260, `status` = `repaint`. |
| Статус | Not run |
| Фактический результат | |
