# 09 — Модерация: очередь, отклонение с причиной, жалобы

## Spec

- [x] interview
- [S] mockups — экраны очереди и жалоб уже в `ui/mockups/index.html`
- [x] api-spec
- [x] test-spec

## Tier 1 — Backend

- [~] api-01 the queue holds what is waiting, oldest first
- [ ] api-02 the queue holds nothing that is not waiting
- [ ] api-03 a rejection carries a label the seller can act on
- [ ] api-07 anyone signed in may complain about a published listing
- [ ] api-08 one person complains about one listing once
- [ ] api-11 complaints reach the moderator grouped by listing
- [ ] api-12 taking a listing down answers its complaints in one decision

## Tier 1 — Integration

- [ ] int-01 a listing walks the whole loop and the queue follows it

## Tier 1 — Security

- [ ] sec-01 the queue is closed to everyone but a moderator
- [ ] sec-02 moderator actions are closed the same way

- [ ] harvest

## Tier 2 — Backend

- [ ] api-04 a rejection without a label is refused
- [ ] api-05 a label the moderator invented is refused
- [ ] api-06 a rejected listing is corrected and comes back
- [ ] api-09 a seller cannot complain about their own listing
- [ ] api-10 there is nothing to complain about until a listing is published
- [ ] api-13 a complaint the moderator disagrees with is closed as unfounded
- [ ] api-14 a complaint is settled once
- [ ] api-15 nothing is taken down by the number of complaints alone
- [ ] api-16 a listing that is not published cannot be taken down
- [ ] api-17 the tabs count what they say they count
- [ ] api-18 the complained tab holds the listings that were complained about

## Tier 2 — Security

- [ ] sec-03 a complaint requires signing in
- [ ] sec-04 a complaint does not carry its author to the seller

## Tier 2 — Infrastructure

- [ ] inf-01 one person cannot hold two complaints about one listing
- [ ] inf-02 listings rejected before the labels existed keep their text

## Отложено

- [S] api-19 страницы очереди — `tests/tier3/`, тот же механизм проверен на ленте
- [S] чат с продавцом с экрана жалоб — история 11
- [S] рейтинг продавца в строке очереди — история 12
- [S] разбор `catalog_suggestions` — другая очередь, отдельная история
