# 07 — Лента и карточка объявления (истории 7 и 8)

## Spec

- [x] interview
- [S] mockups — экраны ленты и карточки уже нарисованы в `ui/mockups/index.html`
- [x] api-spec
- [x] test-spec

## Tier 1 — Backend

- [x] api-01 the feed answers with a page and an honest count
- [x] api-02 the feed shows only what has been published
- [x] api-03 a make narrows the feed, and a model narrows it further
- [x] api-08 filters narrow together, not one at a time
- [x] api-09 the feed sorts by price in both directions and by newness by default
- [x] api-10 no listing appears on two pages, and none is skipped
- [x] api-15 the phone number is given only when it is asked for

## Tier 1 — Integration

- [x] int-01 a listing enters the feed when published and leaves when sold

## Tier 1 — Security

- [x] sec-01 the feed never carries a phone number
- [x] sec-02 an unpublished listing cannot be found through the feed

- [x] harvest

## Tier 2 — Backend

- [x] api-04 a model asked for without a make is refused
- [x] api-05 ranges are inclusive at both ends
- [x] api-06 a range given backwards is refused rather than answered emptily
- [x] api-07 several gearboxes can be asked for at once
- [x] api-11 a page past the end of the feed is empty, not an error
- [x] api-12 filters that match nothing say so honestly
- [x] api-13 a feed card carries what the card shows and nothing more
- [x] api-14 the listing card names its seller
- [x] api-16 asking for a phone number requires signing in
- [x] api-17 the owner sees their own phone number without asking
- [x] api-18 a phone number is not revealed for a listing nobody may see
- [x] api-19 the size of a page is bounded

## Tier 2 — Security

- [x] sec-03 revealing a phone number is not a way to enumerate listings
- [x] sec-04 a filter value is data, not a query

## Tier 2 — Infrastructure

- [x] inf-01 the columns the feed filters on are indexed

## Отложено

- [S] load-01, load-02 — `tests/tier3/`, меряют форму запроса недетерминированно
- [S] фильтр «с картой замеров» — история 14
- [S] таб «под заказ» — история 17
- [S] рейтинг продавца в карточке — история 12
