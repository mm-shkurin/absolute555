# 15 — OCR толщиномера

## Spec

- [x] interview
- [S] mockups — режим «Распознавание» уже в `ui/mockups/index.html`
- [x] api-spec — правка `api-specs/sale_car_thickness.yaml`
- [x] test-spec

## Tier 1 — Backend

- [x] api-01 a reading typed by the seller keeps its source
- [x] api-02 a photograph that cannot be read is refused
- [x] api-03 a correction is recorded against what was read
- [x] api-04 the feed filters by a complete map

## Tier 1 — Frontend

- [x] fe-01 an empty value field leaves the reading to the server instead of sending a zero
- [x] fe-02 a correction is shown together with what was read from the device
- [x] fe-03 a reading that was not corrected is not called a correction
- [x] fe-04 the feed filter keeps only listings with a complete map

## Отложено

- [S] подъём объявления с полной картой в сортировке — правило «выше чего» не задано
- [S] очередь и экран ожидания — распознавание синхронно
