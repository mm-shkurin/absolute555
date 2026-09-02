# 18 — Импорт: заявки покупателя и отклики

## Spec

- [x] interview
- [S] mockups — экранов заявки в макете нет, вёрстку ведёт фронтовая полоса
- [x] api-spec
- [x] test-spec

## Tier 1 — Backend

- [x] api-01 a buyer opens a request
- [x] api-02 the open requests of one buyer are capped
- [x] api-03 closing a request frees a slot
- [x] api-04 a supplier sees the open requests
- [x] api-05 one response per supplier, corrected in place
- [x] api-06 the buyer sees every response
- [x] api-07 a supplier sees only their own response
- [x] api-08 a closed request takes no more responses
- [x] api-09 the buyers own list counts the responses

## Tier 1 — Security

- [x] sec-01 the demand feed refuses a buyer
- [x] sec-02 a stranger reads no responses
- [x] sec-03 somebody elses request is not closed

## Отложено

- [S] модерация заявок — вместо неё лимит открытых
- [S] выбор победителя и сделка по заявке — чат истории 11 и объявление истории 17
