# 14 — Карта толщиномера: панели, замеры, фото

## Spec

- [x] interview
- [S] mockups — экран карты замеров уже в `ui/mockups/index.html`
- [x] api-spec
- [x] test-spec

## Tier 1 — Backend

- [x] api-01 a seller records a measurement and the panel appears on the map
- [x] api-02 a second write to the same panel overwrites it
- [x] api-03 a buyer reads the map of a published listing
- [x] api-04 a measurement without a photograph is refused
- [x] api-05 a panel outside the fixed set does not exist
- [x] api-06 a value outside 1..3000 is refused
- [x] api-07 all thirteen panels make the map complete
- [x] api-08 the listing card carries the measurement summary
- [x] api-09 removing a measurement makes the map incomplete again

## Tier 1 — Security

- [x] sec-01 writing requires signing in

- [x] harvest

## Tier 2 — Backend

- [x] api-10 somebody elses listing is not found
- [x] api-11 a measurement is editable after publication
- [x] api-12 a file that is not an image is refused
- [x] api-13 a stranger does not read a draft map
- [x] api-14 thresholds place factory, repaint and filler
- [x] api-15 a listing with no measurements returns an empty map

## Tier 2 — Infrastructure

- [x] inf-01 one measurement per panel, enforced by the database

## Отложено

- [S] tier3 — записаны в `tests/scenarios.md`
- [S] «гость не пишет замеры» — черновики гостю разрешены с истории 5, отдельного
  правила для замеров нет; осталась проверка «запись требует входа»
