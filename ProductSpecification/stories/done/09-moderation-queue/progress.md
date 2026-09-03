# 09 — Модерация: очередь, отклонение с причиной, жалобы

## Spec

- [x] interview
- [S] mockups — экраны очереди и жалоб уже в `ui/mockups/index.html`
- [x] api-spec
- [x] test-spec

## Tier 1 — Backend

- [x] api-01 the queue holds what is waiting, oldest first
- [x] api-02 the queue holds nothing that is not waiting
- [x] api-03 a rejection carries a label the seller can act on
- [x] api-07 anyone signed in may complain about a published listing
- [x] api-08 one person complains about one listing once
- [x] api-11 complaints reach the moderator grouped by listing
- [x] api-12 taking a listing down answers its complaints in one decision

## Tier 1 — Integration

- [x] int-01 a listing walks the whole loop and the queue follows it

## Tier 1 — Security

- [x] sec-01 the queue is closed to everyone but a moderator
- [x] sec-02 moderator actions are closed the same way

- [x] harvest

## Tier 2 — Backend

- [x] api-04 a rejection without a label is refused
- [x] api-05 a label the moderator invented is refused
- [x] api-06 a rejected listing is corrected and comes back
- [x] api-09 a seller cannot complain about their own listing
- [x] api-10 there is nothing to complain about until a listing is published
- [x] api-13 a complaint the moderator disagrees with is closed as unfounded
- [x] api-14 a complaint is settled once
- [x] api-15 nothing is taken down by the number of complaints alone
- [x] api-16 a listing that is not published cannot be taken down
- [x] api-17 the tabs count what they say they count
- [x] api-18 the complained tab holds the listings that were complained about

## Tier 2 — Security

- [x] sec-03 a complaint requires signing in
- [x] sec-04 a complaint does not carry its author to the seller

## Tier 2 — Infrastructure

- [x] inf-01 one person cannot hold two complaints about one listing
- [S] inf-02 listings rejected before the labels existed keep their text

## Tier 1 — Frontend

- [x] fe-01 the queue shows what waits and the moderator reviews it beside the list
- [x] fe-02 a rejection asks for a labelled reason before it is sent
- [x] fe-03 complaints are read on their own tab
- [x] fe-04 the sections of moderation are reachable from one another

## Отложено

- [S] inf-02 — миграция добавляет `reject_label` как nullable и ничего не трогает в
  существующих строках; проверять нечему, кроме самого отката ревизии в CI

- [S] api-19 страницы очереди — `tests/tier3/`, тот же механизм проверен на ленте
- [S] чат с продавцом с экрана жалоб — история 11
- [S] рейтинг продавца в строке очереди — история 12
- [S] разбор `catalog_suggestions` — другая очередь, отдельная история
