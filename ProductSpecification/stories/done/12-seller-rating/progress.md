# 12 — Рейтинг продавца и публичный профиль

## Spec

- [x] interview
- [S] mockups — карточка, очередь и офферы уже в `ui/mockups/index.html`
- [x] api-spec
- [x] test-spec

## Tier 1 — Backend

- [x] api-01 a buyer rates the seller after an accepted offer
- [x] api-02 a review without a deal is refused
- [x] api-05 the seller carries an average and a count
- [x] api-06 a seller nobody has rated has no rating
- [x] api-07 the listing card carries the sellers rating
- [x] api-08 the moderation queue row carries it too
- [x] api-09 the offers screen knows whether a review can be left
- [x] api-10 the offers screen knows a review was already left
- [x] api-17 the public profile is readable without signing in

## Tier 1 — Security

- [x] sec-01 a guest leaves no reviews

- [x] harvest

## Tier 2 — Backend

- [x] api-03 somebody elses offer is not a way in
- [x] api-04 one deal, one review
- [x] api-11 a review may be corrected within a day
- [x] api-12 after a day the review is settled
- [x] api-13 only the author corrects a review
- [x] api-14 a rating outside one to five is refused
- [x] api-15 words are optional
- [x] api-16 deals counted are accepted offers, not reviews
- [x] api-18 the profile lists the sellers reviews newest first
- [x] api-19 the profile shows only published listings
- [x] api-20 a profile of nobody is not found

## Tier 2 — Security

- [x] sec-02 writing routes refuse a caller who has not signed in
- [x] sec-03 the phone number does not leak through a profile
- [x] sec-04 a review cannot be written against a seller of ones choosing
- [x] sec-05 a seller cannot rate themselves

## Tier 2 — Infrastructure

- [x] inf-01 one review per offer, enforced by the database

## Tier 1 — Frontend

- [x] fe-01 the seller page shows the rating, the reviews and the listings still on sale
- [x] fe-02 a seller with no reviews says so instead of showing a zero
- [x] fe-03 a guest reads the seller page: it is public, like the feed

## Отложено

- [S] int-01 сквозной путь принятия и оценки — правило целиком проверено api-01 и api-07
- [S] inf-02 откат ревизии — тот же откат уже гоняет гейт alembic в полном прогоне
- [S] оценка покупателя продавцом — рейтинг односторонний
- [S] ответ на отзыв и жалоба на отзыв — модерация отзывов, отдельная история
- [S] удаление отзыва — рейтинг перестал бы значить
- [S] уведомление «оставьте отзыв» — уведомлений нет ни в одной истории
