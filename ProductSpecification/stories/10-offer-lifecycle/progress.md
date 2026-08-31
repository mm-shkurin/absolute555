# 10 — Офферы: отзыв, истечение, автоотклонение при продаже

## Spec

- [x] interview
- [S] mockups — экран офферов уже в `ui/mockups/index.html`
- [x] api-spec
- [x] test-spec

## Tier 1 — Backend

- [x] api-01 a buyer sees what they sent, a seller sees what they were sent
- [x] api-02 a buyer withdraws an offer the seller has not answered
- [x] api-06 accepting one offer sells the car and closes the rest
- [x] api-07 a sold car leaves the feed the moment the offer is accepted
- [x] api-10 an offer expires by itself when nobody answers
- [x] api-11 an expired offer cannot be accepted
- [x] api-15 there is nothing to bargain over until a listing is published

## Tier 1 — Integration

- [S] int-01 accepting an offer moves the listing and the offers together or not at all

## Tier 1 — Security

- [x] sec-01 only the seller settles an offer on their listing
- [x] sec-02 offers of others are not readable through either tab

- [x] harvest

## Tier 2 — Backend

- [x] api-03 withdrawing is not a ban on bargaining
- [x] api-04 only the buyer withdraws their own offer
- [x] api-05 a settled offer cannot be withdrawn
- [x] api-08 rejecting one offer leaves the others alone
- [x] api-09 an offer is settled once
- [x] api-12 the expiry leaves alone what is still in time
- [x] api-13 the expiry does not touch what was already settled
- [x] api-14 an offer carries the moment it will expire
- [x] api-16 a sold listing takes no new offers
- [x] api-17 a guest does not bargain
- [x] api-18 running the expiry twice changes nothing the second time

## Tier 2 — Security

- [x] sec-03 every offer route refuses a caller who has not signed in

## Tier 2 — Infrastructure

- [x] inf-01 offers made before the statuses grew keep their meaning
- [x] inf-02 the expiry runs on its own schedule

## Отложено

- [S] int-01 — принятие уже идёт одной транзакцией сервиса; чтобы разорвать её посередине
  снаружи, нужен отказ базы по расписанию, а такой тест проверяет подделку, а не правило

- [S] чат и кнопка «написать» из строки оффера — история 11
- [S] рейтинг покупателя и «оставить отзыв» — история 12
- [S] уведомления о новом оффере и об истечении — отдельная история
