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
- `GET /list/on-sale` и `GET /list/sold` удаляются: с шестью статусами путь на статус не
  масштабируется, а `GET /list?status=` уже есть.
