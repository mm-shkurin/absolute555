# Объявление: черновик и жизненный цикл статусов - API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/sale_car | Создать пустой черновик |
| PATCH | /api/v1/sale_car/{sale_car_id} | Сохранить любое подмножество полей |
| GET | /api/v1/sale_car/user?status= | Свои объявления, фильтр по корзине |
| GET | /api/v1/sale_car/{sale_car_id} | Одно объявление; неопубликованное — только владельцу |
| POST | /api/v1/sale_car/{sale_car_id}/submit | draft -> moderation, с проверкой полноты |
| POST | /api/v1/sale_car/{sale_car_id}/withdraw | published -> withdrawn, sold -> withdrawn |
| POST | /api/v1/sale_car/{sale_car_id}/sold | published -> sold |
| POST | /api/v1/sale_car/{sale_car_id}/republish | withdrawn -> moderation |
| POST | /api/v1/sale_car/{sale_car_id}/revise | rejected -> draft, причина отклонения снимается |
| POST | /api/v1/sale_car/{sale_car_id}/approve | moderation -> published, только модератор |
| POST | /api/v1/sale_car/{sale_car_id}/reject | moderation -> rejected с причиной, только модератор |
| POST | /api/v1/sale_car/{sale_car_id}/photos | Добавить снимок в галерею |

## Notes

- Статус меняют только именованные действия. `PATCH` поле `status` не принимает, а
  `PATCH /{id}/status` удаляется: клиент, который может присвоить любое значение,
  обходит машину переходов целиком.
- Недопустимый переход — `409`, тело называет текущий статус и допустимые из него.
  Неполный `submit` — `422` со списком **всех** недостающих полей.
- Чужое неопубликованное объявление — `404`, не `403`.
- `approve` и `reject` пришли из истории 9: без них ни один сценарий не доходит до
  `published`, а три перехода, выходящие из него, — Tier 1. Права — существующий
  `EDIT_ANY_SALE_CAR`.
- `POST /{id}/photos` наполняет галерею объявления. До этой истории он дописывал в
  `sts_photos` — снимки документа — и заполнить то, что читает проверка полноты, было
  нечем: `submit` был недостижим. Порядок, обложка и потолок в 15 снимков — история 5.
- Тело отказа — общая оболочка `{error, message, code, details}`, описанная в
  `ProductSpecification/api-specs/errors.yaml`. `409` несёт `details.current_status` и
  `details.allowed`, `422` на неполном объявлении — `details.missing_fields`.
- `GET /list/on-sale` и `GET /list/sold` удаляются: с шестью статусами путь на статус не
  масштабируется, а `GET /list?status=` уже есть.
