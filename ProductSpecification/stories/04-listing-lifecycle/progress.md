# 04 — Объявление: черновик и жизненный цикл статусов

## Spec

- [x] interview
- [x] api-spec
- [x] test-spec

## Tier 1 — Backend

- [~] api-01 seller creates an empty draft
- [ ] api-02 seller saves part of a listing and returns to it
- [ ] api-03 seller sends a complete draft for review
- [ ] api-04 incomplete draft names every missing field at once
- [ ] api-05 seller withdraws a published listing
- [ ] api-06 seller marks a published listing sold
- [ ] api-07 seller returns a withdrawn listing through review
- [ ] api-08 a transition the current status does not allow is refused
- [ ] api-09 seller reads own listings one basket at a time

## Tier 1 — Security

- [ ] sec-01 a stranger cannot see that someone else's draft exists

- [ ] harvest

## Tier 2 — Backend

- [ ] api-10 a seller may hold no more than five drafts
- [ ] api-11 a status sent as an ordinary field is not accepted
- [ ] api-12 a listing under review cannot be edited
- [ ] api-13 a rejected listing is corrected as a draft and sent again
- [ ] api-14 a listing marked sold by mistake is withdrawn
- [ ] api-15 a price survives saving and reading unchanged
- [ ] api-16 sending the same draft for review twice changes nothing
- [ ] api-17 two actions arriving together leave one status
- [ ] api-18 a published listing records when it was published

## Tier 2 — Integration

- [ ] int-01 a status change is announced to the Telegram channel
- [ ] int-02 a failing announcement does not undo the status change

## Tier 2 — Frontend

- [ ] ui-01 my listings are grouped by status

## Tier 2 — Security

- [ ] sec-02 a stranger cannot move someone else's listing
- [ ] sec-03 lifecycle actions require a signed-in user

## Tier 2 — Infrastructure

- [x] inf-01 existing listings survive the move to the six statuses (pulled forward: schema gates every scenario)
