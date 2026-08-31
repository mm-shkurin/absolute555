# Карта контрактов: что сервер отдаёт сегодня

Составлена чтением `backend/app/api/` и `backend/app/schemas/` на текущем коммите.
Типы и клиенты под неё лежат в `frontend/src/shared/api/backend/`.

Базовый префикс — `/api/v1` (`app/main.py`). Смонтировано семь групп: `auth`, `user`,
`role`, `task`, `sale_car`, `offer`, `catalog`.

## Что есть

| Метод и путь | Отдаёт | Клиент на фронте |
|---|---|---|
| `POST /auth/guest/login` | `Token` по `device_id` | `accountApi.guestLogin` |
| `POST /auth/refresh` | `Token` по `refresh_token` | уже есть в `shared/session/refreshApi` |
| `GET /auth/yandex/login`, `/yandex/login/web`, `/vk/login` | редирект на провайдера | только адрес, запроса нет |
| `GET /user/profile` | `User_Data` | `accountApi.fetchProfile` |
| `GET /catalog/brands`, `/catalog/brands/{id}/models` | справочник | `referenceApi` |
| `POST /sale_car` | пустой черновик | `saleCarApi.createDraft` |
| `GET /sale_car/list?status=` | список объявлений | `saleCarApi.fetchPublished` |
| `GET /sale_car/user?status=` | свои объявления | `saleCarApi.fetchMyListings` |
| `GET`, `PATCH`, `DELETE /sale_car/{id}` | одно объявление | `fetchListing`, `patchListing`, `deleteListing` |
| `POST`, `DELETE`, `PUT /sale_car/{id}/photos…` | галерея целиком | `uploadPhotos`, `deletePhoto`, `reorderPhotos` |
| `POST /sale_car/{id}/sts` (202), `GET /sale_car/{id}/sts` | принятие скана, подписанная ссылка | `attachSts`, `fetchStsLink` |
| `POST /sale_car/{id}/{submit,withdraw,sold,republish,revise}` | новый статус | `changeStatus` |
| `POST /sale_car/{id}/{approve,reject}` | новый статус, модератору | `approveListing`, `rejectListing` |
| `POST /offer/`, `GET /offer/my`, `/offer/car/{id}`, `/offer/{id}` | предложения | `offerApi` |
| `PATCH /offer/{id}/status` | ответ на предложение | `offerApi.answerOffer` |
| `GET /role/*`, `PUT /role/users/{id}/role`, заявки на роль | роли и заявки | `accountApi` |
| `GET /task/sse/{id}` | `text/event-stream` о распознавании | `listingStream.openListingStream` |

## Расхождения с тем, что фронт уже предполагает

`shared/api/endpoints.ts` описывает пространство из спецификации (`/listings`, `/offers`,
`/users/me`, `/recognition/*`, `/thickness/*`). Сервер отвечает по другим адресам, и ни
один путь из этих двух карт не совпадает. Поэтому реальные адреса вынесены отдельно, в
`shared/api/backend/paths.ts`, и старая карта не тронута: она — цель, а не описание.

Точечные различия формы:

- **Лента.** `fetchFeed` ждёт `{ items, total }`; сервер отдаёт голый массив без общего
  числа, без страниц и без фильтров — ни города, ни цены, ни коробки.
- **Поля объявления.** На проводе `milleage` (опечатка сервера), `engine_power`,
  `mark_raw`/`model_raw` рядом с `brand`/`model` из справочника. `ListingWire` в
  `shared/domain/listing` описывает другой, ещё не существующий ответ.
- **Статусы предложения** — `accept` и `reject`, не `accepted`/`rejected`.
- **OAuth.** Фронт ждёт `POST /auth/oauth/exchange`; сервер построен на редиректах с
  серверным callback.

## Чего на сервере нет вовсе

Карта замеров и панели кузова; распознавание экрана толщиномера; чаты; жалобы; отзывы и
рейтинг продавца; публичный профиль чужого продавца; канал «под заказ» целиком
(поставщики, заявки, отклики); очередь модерации как отдельная выдача; отзыв своего
предложения — `DELETE /offer/{id}` и `GET /offer/{id}/with-details` в `app/api/offer.py`
лежат внутри строкового литерала и не зарегистрированы.

## Замечание по доступу

`GET /sale_car/list` не требует авторизации и принимает `status` любым значением из
перечисления. Запрос `?status=draft` или `?status=moderation` отдаёт чужие черновики и
всё, что ждёт модерации, вместе с `phone_number` владельца. Соседний `GET /sale_car/{id}`
эту же выдачу закрывает: неопубликованное объявление он отдаёт только владельцу.
