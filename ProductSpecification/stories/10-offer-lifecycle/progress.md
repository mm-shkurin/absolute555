# 10 — Офферы: отзыв, истечение, автоотклонение при продаже

## Spec

- [x] interview
- [S] mockups — экран офферов уже в `ui/mockups/index.html`
- [x] api-spec
- [x] test-spec

## Tier 1 — Backend

- [~] api-01 a buyer sees what they sent, a seller sees what they were sent
- [ ] api-02 a buyer withdraws an offer the seller has not answered
- [ ] api-06 accepting one offer sells the car and closes the rest
- [ ] api-07 a sold car leaves the feed the moment the offer is accepted
- [ ] api-10 an offer expires by itself when nobody answers
- [ ] api-11 an expired offer cannot be accepted
- [ ] api-15 there is nothing to bargain over until a listing is published

## Tier 1 — Integration

- [ ] int-01 accepting an offer moves the listing and the offers together or not at all

## Tier 1 — Security

- [ ] sec-01 only the seller settles an offer on their listing
- [ ] sec-02 offers of others are not readable through either tab

- [ ] harvest

## Tier 2 — Backend

- [ ] api-03 withdrawing is not a ban on bargaining
- [ ] api-04 only the buyer withdraws their own offer
- [ ] api-05 a settled offer cannot be withdrawn
- [ ] api-08 rejecting one offer leaves the others alone
- [ ] api-09 an offer is settled once
- [ ] api-12 the expiry leaves alone what is still in time
- [ ] api-13 the expiry does not touch what was already settled
- [ ] api-14 an offer carries the moment it will expire
- [ ] api-16 a sold listing takes no new offers
- [ ] api-17 a guest does not bargain
- [ ] api-18 running the expiry twice changes nothing the second time

## Tier 2 — Security

- [ ] sec-03 every offer route refuses a caller who has not signed in

## Tier 2 — Infrastructure

- [ ] inf-01 offers made before the statuses grew keep their meaning
- [ ] inf-02 the expiry runs on its own schedule

## Отложено

- [S] чат и кнопка «написать» из строки оффера — история 11
- [S] рейтинг покупателя и «оставить отзыв» — история 12
- [S] уведомления о новом оффере и об истечении — отдельная история
