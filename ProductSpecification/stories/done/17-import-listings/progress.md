# 17 — Импорт: объявления под привоз

## Spec

- [x] interview
- [S] mockups — канал привоза в макете отдельным экраном не нарисован
- [x] api-spec
- [x] test-spec

## Tier 1 — Backend

- [x] api-01 an importer opens an import draft
- [x] api-02 an ordinary seller is refused an import draft
- [x] api-03 a draft is a car in stock by default
- [x] api-04 the terms of the delivery are kept
- [x] api-05 an import listing is asked for country, term and turnkey price
- [x] api-06 an import listing publishes without a vin
- [x] api-07 the feed filters by channel

## Tier 1 — Frontend

- [x] fe-01 an import card names the channel, the country and the turnkey price
- [x] fe-02 the stock feed shows no import listings: the channel is chosen by the query
- [x] fe-03 the channel comes as a field, not guessed from a delivery term that was filled in
- [x] fe-04 the wizard hides mileage for an import listing and asks for the three import fields
- [x] fe-05 a refusal to publish names the missing fields instead of "fill in the listing"
- [x] fe-06 the "sell an import" button is shown only to an importer

## Отложено

- [S] смена канала у живого объявления — покупатель торговался бы за другую машину
- [S] отдельная лента привоза — покупатель ищет машину, а не канал
