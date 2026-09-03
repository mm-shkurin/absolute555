# 06 — Автозаполнение из СТС: привязка к справочнику

## Spec

- [x] interview
- [S] mockups — экран шага 2 вынесен во фронтовую стори 20
- [x] api-spec
- [x] test-spec

## Tier 1 — Backend

- [x] api-01 a registration scan fills the draft it is attached to
- [x] api-02 an unreadable photograph leaves the draft standing
- [x] api-03 a readable photograph whose contents make no sense is reported apart
- [x] api-04 a make the catalogue does not know does not stop the sale
- [x] api-05 what the seller chose survives a second reading
- [x] api-09 the outcome outlives the connection that reported it
- [x] api-10 an unmatched model does not hold up the review

## Tier 1 — Security

- [x] sec-01 a stranger cannot attach a document to a listing that is not theirs
- [x] sec-03 nobody outside the reading can set a listing recognition outcome

- [x] harvest

## Tier 2 — Backend

- [x] api-06 choosing from the catalogue answers the moderator question
- [x] api-07 a second scan replaces the first
- [x] api-08 a published listing takes no new scan
- [x] api-11 ten sellers spelling one model the same way are one question
- [ ] api-12 a reading that finishes after its listing is gone changes nothing

## Tier 2 — Security

- [x] sec-02 attaching a document requires a signed-in caller

## Tier 2 — Integration

- [x] int-01 the reading is handed the stored document, not the bytes
- [x] int-02 a recognition service that is unreachable is reported apart from a bad photograph

## Tier 2 — Infrastructure

- [x] inf-01 existing listings stay sendable when the catalogue keys stop being required

## Tier 1 — Frontend

- [x] fe-01 a registration scan is attached from inside the browser and the wizard moves on
- [x] fe-02 a recognised field is marked as coming from the document, not typed by the seller

## Отложено

- [S] ui-01.. экран шага 2 мастера — фронтовая стори 20 в `stories.md`
- [S] api-12 — задача уже возвращает DecodeFailed на исчезнувшее объявление; чёрный ящик к этому пути не дотягивается без воркера
- [S] пороги нечёткого сопоставления — прогон на реальных выдачах, отдельная задача
