# Лента объявлений

Публичная лента `GET /sale_car/list`: только опубликованные объявления (`published`)
незаблокированных продавцов, фильтры, сортировка и пагинация. Авторизация не нужна.
Окружение, учётные записи и формат ошибки — в [README.md](README.md).

Параметры запроса (`backend/app/features/listing/api/feed_query.py`): `brand_id`, `model_id`,
`year_from`, `year_to`, `price_from`, `price_to`, `mileage_from`, `mileage_to`,
`transmission` (можно повторять), `with_thickness_map`, `kind` (`stock` / `import`),
`sort` (`newest` по умолчанию / `price_asc` / `price_desc`), `page` (≥ 1, по умолчанию 1),
`size` (1…60, по умолчанию 20). Концы диапазонов включительно.
Ответ: `{"items": [FeedCard], "total", "page", "size"}`.

**Как опубликовать объявление (общее предусловие):** `SELLER_A` создаёт объявление по
TC-LST-001 (listings-1.md), заполняет `PATCH /sale_car/<ID>` полями `brand_id`, `model_id`,
`price`, `milleage`, `phone_number`, `year`, загружает 3 фото (photos.md, TC-PHO-001),
`POST /sale_car/<ID>/submit`, затем `MODERATOR_M` — `POST /sale_car/<ID>/approve`.

### TC-FEED-001 — Лента отдаёт страницу и общий счётчик без авторизации

| Поле | Значение |
|---|---|
| ID | TC-FEED-001 |
| Название | `GET /sale_car/list` без токена возвращает `items`, `total`, `page`, `size` |
| История | 07 — feed-and-listing-card |
| Описание | Основной сценарий: гость видит ленту и число найденных |
| Приоритет | High |
| Предусловия | Опубликовано хотя бы одно объявление `SELLER_A` (`<PUB>`) |
| Тестовые данные | `size=5` |
| Шаги | 1. `GET /sale_car/list?size=5` без заголовка `Authorization` |
| Ожидаемый результат | `200`; `page` = 1, `size` = 5; `len(items)` ≤ 5; `total` ≥ 1; `<PUB>` есть среди `items[].sale_car_id` (если объявлений больше 5 — искать на следующих страницах) |
| Статус | Not run |
| Фактический результат | |

### TC-FEED-002 — Карточка несёт только поля карточки

| Поле | Значение |
|---|---|
| ID | TC-FEED-002 |
| Название | В карточке ленты нет `description` и `phone_number` |
| История | 07 — feed-and-listing-card |
| Описание | Телефон открывается только отдельной ручкой; лента не должна раздавать номера |
| Приоритет | High |
| Предусловия | Опубликовано объявление `<PUB>` с `phone_number` = `+79990000000` и 3 фото |
| Тестовые данные | — |
| Шаги | 1. `GET /sale_car/list?size=60` |
| Ожидаемый результат | `200`; у карточки `<PUB>` заполнены `brand`, `model`, `price`, `preview_photo_url`, `status` = `published`; ключей `description` и `phone_number` нет; строки `+79990000000` нет нигде в ответе |
| Статус | Not run |
| Фактический результат | |

### TC-FEED-003 — Черновик не попадает в ленту

| Поле | Значение |
|---|---|
| ID | TC-FEED-003 |
| Название | Неопубликованное объявление не видно ни в общей, ни в отфильтрованной ленте |
| История | 07 — feed-and-listing-card |
| Описание | Лента показывает только `published` |
| Приоритет | High |
| Предусловия | `<PUB>` опубликовано; `<DRAFT>` — объявление `SELLER_A` той же марки/модели в статусе `draft` |
| Тестовые данные | `brand_id`, `model_id` объявления `<DRAFT>` |
| Шаги | 1. `GET /sale_car/list?size=60`<br>2. `GET /sale_car/list?brand_id=<BRAND>&model_id=<MODEL>&size=60`, `Authorization: Bearer <TOKEN_BUYER_B>` |
| Ожидаемый результат | 1. `200`; `<PUB>` в `items`, `<DRAFT>` нет<br>2. `200`; `<DRAFT>` нет в `items` |
| Статус | Not run |
| Фактический результат | |

### TC-FEED-004 — Фильтры по марке, модели и исполнениям модели

| Поле | Значение |
|---|---|
| ID | TC-FEED-004 |
| Название | `model_id` семейства находит исполнения («GS» → «GS 430»), но не соседние («GS 300») |
| История | 07 — feed-and-listing-card |
| Описание | Справочник хранит исполнения отдельными строками; покупатель ищет машину |
| Приоритет | Medium |
| Предусловия | Опубликовано объявление `<PUB>` Lexus GS 430; id марки Lexus и моделей `GS`, `GS 300` взяты из `GET /catalog/brands` и `GET /catalog/brands/<BRAND>/models` |
| Тестовые данные | `<BRAND>` = Lexus; `<GS>`, `<GS300>` |
| Шаги | 1. `GET /sale_car/list?brand_id=<BRAND>&size=60`<br>2. `GET /sale_car/list?brand_id=<BRAND>&model_id=<GS>&size=60`<br>3. `GET /sale_car/list?brand_id=<BRAND>&model_id=<GS300>&size=60` |
| Ожидаемый результат | 1. `200`; `<PUB>` в `items`; `total` ≥ `total` шага 2<br>2. `200`; `<PUB>` в `items`<br>3. `200`; `<PUB>` нет в `items` |
| Статус | Not run |
| Фактический результат | |

### TC-FEED-005 — Фильтры применяются вместе, диапазоны включительно

| Поле | Значение |
|---|---|
| ID | TC-FEED-005 |
| Название | Год, цена и коробка сужают ленту одновременно; концы диапазона включаются |
| История | 07 — feed-and-listing-card |
| Описание | Все переданные фильтры действуют разом; несколько `transmission` — «любая из» |
| Приоритет | Medium |
| Предусловия | Опубликованы: `<A>` year 2010, transmission `автомат`, price 1500000; `<B>` year 2015, `механика`; `<C>` year 2012, `вариатор` |
| Тестовые данные | см. шаги |
| Шаги | 1. `GET /sale_car/list?year_from=2010&year_to=2015&size=60`<br>2. `GET /sale_car/list?transmission=автомат&transmission=механика&size=60`<br>3. `GET /sale_car/list?year_from=2010&year_to=2010&price_to=2000000&size=60` |
| Ожидаемый результат | 1. `200`; `<A>` и `<B>` в `items`<br>2. `200`; `<A>` и `<B>` в `items`, `<C>` нет<br>3. `200`; `<A>` в `items`; у всех карточек `year` = 2010 и `price` ≤ 2000000 |
| Статус | Not run |
| Фактический результат | |

### TC-FEED-006 — Сортировка по цене и по новизне

| Поле | Значение |
|---|---|
| ID | TC-FEED-006 |
| Название | `sort=price_asc` / `price_desc` упорядочивают по цене; по умолчанию первым идёт последнее опубликованное |
| История | 07 — feed-and-listing-card |
| Описание | Порядок стабилен, при равной цене — по `sale_car_id` |
| Приоритет | Medium |
| Предусловия | Опубликованы несколько объявлений с разной ценой; `<NEWEST>` опубликовано последним |
| Тестовые данные | — |
| Шаги | 1. `GET /sale_car/list?sort=price_asc&size=60`<br>2. `GET /sale_car/list?sort=price_desc&size=60`<br>3. `GET /sale_car/list?size=60` |
| Ожидаемый результат | 1. `200`; `items[].price` по неубыванию<br>2. `200`; `items[].price` по невозрастанию<br>3. `200`; `items[0].sale_car_id` = `<NEWEST>` |
| Статус | Not run |
| Фактический результат | |

### TC-FEED-007 — Пагинация без повторов и страница за концом

| Поле | Значение |
|---|---|
| ID | TC-FEED-007 |
| Название | Объявление не приходит на двух страницах; страница за концом пуста, `total` сохраняется |
| История | 07 — feed-and-listing-card |
| Описание | Счётчик считается по тому же условию, что и страница |
| Приоритет | Medium |
| Предусловия | Опубликовано не меньше 3 объявлений; `<N>` = `total` из `GET /sale_car/list` |
| Тестовые данные | `size=2` |
| Шаги | 1. `GET /sale_car/list?sort=price_asc&size=2&page=1`, затем `page=2`, `page=3`… пока `items` не пуст<br>2. `GET /sale_car/list?page=1000&size=20`<br>3. `GET /sale_car/list?year_from=1901&year_to=1901` |
| Ожидаемый результат | 1. все `200`; объединённые `sale_car_id` без повторов, их число = `<N>`<br>2. `200`; `items` = `[]`, `total` = `<N>`<br>3. `200`; `items` = `[]`, `total` = 0 |
| Статус | Not run |
| Фактический результат | |

### TC-FEED-008 — Границы `page` и `size`

| Поле | Значение |
|---|---|
| ID | TC-FEED-008 |
| Название | `size` > 60, `size` = 0 и `page` = 0 отклоняются `422 FEED_QUERY_INVALID`; `size` = 60 принимается |
| История | 07 — feed-and-listing-card |
| Описание | Размер страницы ограничен `MAX_PAGE_SIZE` = 60 |
| Приоритет | Low |
| Предусловия | — |
| Тестовые данные | см. шаги |
| Шаги | 1. `GET /sale_car/list?size=60`<br>2. `GET /sale_car/list?size=61`<br>3. `GET /sale_car/list?size=0`<br>4. `GET /sale_car/list?page=0` |
| Ожидаемый результат | 1. `200`, `size` = 60<br>2–4. `422`; `code` = `FEED_QUERY_INVALID`; в `details.errors[]` элемент с `field` = `size` (шаги 2–3) или `page` (шаг 4) |
| Статус | Not run |
| Фактический результат | |

### TC-FEED-009 — Модель без марки и обратный диапазон

| Поле | Значение |
|---|---|
| ID | TC-FEED-009 |
| Название | `model_id` без `brand_id` и диапазон «от» > «до» отклоняются `422 FEED_QUERY_INVALID` |
| История | 07 — feed-and-listing-card |
| Описание | Опечатка в диапазоне не должна выглядеть как «ничего не найдено» |
| Приоритет | Medium |
| Предусловия | `<MODEL>` — любой `model_id` из каталога |
| Тестовые данные | см. шаги |
| Шаги | 1. `GET /sale_car/list?model_id=<MODEL>`<br>2. `GET /sale_car/list?year_from=2020&year_to=2010`<br>3. `GET /sale_car/list?price_from=3000000&price_to=1000000`<br>4. `GET /sale_car/list?mileage_from=200000&mileage_to=1000` |
| Ожидаемый результат | 1–4. `422`; `code` = `FEED_QUERY_INVALID` |
| Статус | Not run |
| Фактический результат | |

### TC-FEED-010 — Неизвестный параметр и враждебное значение фильтра

| Поле | Значение |
|---|---|
| ID | TC-FEED-010 |
| Название | Неизвестный параметр даёт `422 UNKNOWN_FILTER`; SQL в значении фильтра — просто данные |
| История | 07 — feed-and-listing-card |
| Описание | Нельзя молча игнорировать фильтр; значения не интерпретируются как SQL |
| Приоритет | High |
| Предусловия | — |
| Тестовые данные | `has_thickness_map=true`; `transmission=' OR 1=1 --` (URL-кодировать) |
| Шаги | 1. `GET /sale_car/list?has_thickness_map=true`<br>2. `GET /sale_car/list?transmission=%27%20OR%201%3D1%20--`<br>3. `GET /sale_car/list` |
| Ожидаемый результат | 1. `422`; `code` = `UNKNOWN_FILTER`; `details` = `{"unknown": ["has_thickness_map"]}`<br>2. `200`; `items` = `[]`<br>3. `200` |
| Статус | Not run |
| Фактический результат | |
