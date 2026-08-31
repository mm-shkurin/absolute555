# 12 — Рейтинг продавца и публичный профиль

## Spec

- [x] interview
- [S] mockups — карточка, очередь и офферы уже в `ui/mockups/index.html`
- [x] api-spec
- [x] test-spec

## Tier 1 — Backend

- [ ] api-01 a buyer rates the seller after an accepted offer
- [ ] api-02 a review without a deal is refused
- [ ] api-05 the seller carries an average and a count
- [ ] api-06 a seller nobody has rated has no rating
- [ ] api-07 the listing card carries the sellers rating
- [ ] api-08 the moderation queue row carries it too
- [ ] api-09 the offers screen knows whether a review can be left
- [ ] api-10 the offers screen knows a review was already left
- [ ] api-17 the public profile is readable without signing in

## Tier 1 — Security

- [ ] sec-01 a guest leaves no reviews

- [ ] harvest

## Tier 2 — Backend

- [ ] api-03 somebody elses offer is not a way in
- [ ] api-04 one deal, one review
- [ ] api-11 a review may be corrected within a day
- [ ] api-12 after a day the review is settled
- [ ] api-13 only the author corrects a review
- [ ] api-14 a rating outside one to five is refused
- [ ] api-15 words are optional
- [ ] api-16 deals counted are accepted offers, not reviews
- [ ] api-18 the profile lists the sellers reviews newest first
- [ ] api-19 the profile shows only published listings
- [ ] api-20 a profile of nobody is not found

## Tier 2 — Security

- [ ] sec-02 writing routes refuse a caller who has not signed in
- [ ] sec-03 the phone number does not leak through a profile
- [ ] sec-04 a review cannot be written against a seller of ones choosing
- [ ] sec-05 a seller cannot rate themselves

## Tier 2 — Infrastructure

- [ ] inf-01 one review per offer, enforced by the database

## Отложено

- [S] int-01 сквозной путь принятия и оценки — правило целиком проверено api-01 и api-07
- [S] inf-02 откат ревизии — тот же откат уже гоняет гейт alembic в полном прогоне
- [S] оценка покупателя продавцом — рейтинг односторонний
- [S] ответ на отзыв и жалоба на отзыв — модерация отзывов, отдельная история
- [S] удаление отзыва — рейтинг перестал бы значить
- [S] уведомление «оставьте отзыв» — уведомлений нет ни в одной истории
