# 04 — Объявление: черновик и жизненный цикл статусов

## Spec

- [x] interview
- [x] api-spec
- [x] test-spec

## Tier 1 — Backend

- [x] api-01 seller creates an empty draft
- [x] api-02 seller saves part of a listing and returns to it
- [x] api-03 seller sends a complete draft for review
- [x] api-04 incomplete draft names every missing field at once
- [x] api-05 seller withdraws a published listing
- [x] api-06 seller marks a published listing sold
- [x] api-07 seller returns a withdrawn listing through review
- [x] api-08 a transition the current status does not allow is refused
- [x] api-09 seller reads own listings one basket at a time

## Tier 1 — Security

- [x] sec-01 a stranger cannot see that someone else's draft exists

- [x] harvest

## Tier 2 — Backend

- [x] api-10 a seller may hold no more than five drafts
- [x] api-11 a status sent as an ordinary field is not accepted
- [x] api-12 a listing under review cannot be edited
- [x] api-13 a rejected listing is corrected as a draft and sent again
- [x] api-14 a listing marked sold by mistake is withdrawn
- [x] api-15 a price survives saving and reading unchanged
- [x] api-16 sending the same draft for review twice changes nothing
- [x] api-17 two actions arriving together leave one status
- [x] api-18 a published listing records when it was published

## Tier 2 — Integration

- [x] int-01 a status change is announced to the Telegram channel
- [x] int-02 a failing announcement does not undo the status change

## Tier 2 — Frontend

- [~] ui-01 my listings are grouped by status (frontend lane, not started)

## Tier 2 — Security

- [x] sec-02 a stranger cannot move someone else's listing
- [x] sec-03 lifecycle actions require a signed-in user

## Tier 2 — Infrastructure

- [x] inf-01 existing listings survive the move to the six statuses (pulled forward: schema gates every scenario)
