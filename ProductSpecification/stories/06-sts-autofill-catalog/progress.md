# 06 — Автозаполнение из СТС: привязка к справочнику

## Spec

- [x] interview
- [S] mockups — экран шага 2 вынесен во фронтовую стори 20
- [x] api-spec
- [x] test-spec

## Tier 1 — Backend

- [~] api-01 a registration scan fills the draft it is attached to
- [ ] api-02 an unreadable photograph leaves the draft standing
- [ ] api-03 a readable photograph whose contents make no sense is reported apart
- [ ] api-04 a make the catalogue does not know does not stop the sale
- [ ] api-05 what the seller chose survives a second reading
- [ ] api-09 the outcome outlives the connection that reported it
- [ ] api-10 an unmatched model does not hold up the review

## Tier 1 — Security

- [ ] sec-01 a stranger cannot attach a document to a listing that is not theirs
- [ ] sec-03 nobody outside the reading can set a listing recognition outcome

- [ ] harvest

## Tier 2 — Backend

- [ ] api-06 choosing from the catalogue answers the moderator question
- [ ] api-07 a second scan replaces the first
- [ ] api-08 a published listing takes no new scan
- [ ] api-11 ten sellers spelling one model the same way are one question
- [ ] api-12 a reading that finishes after its listing is gone changes nothing

## Tier 2 — Security

- [ ] sec-02 attaching a document requires a signed-in caller

## Tier 2 — Integration

- [ ] int-01 the reading is handed the stored document, not the bytes
- [ ] int-02 a recognition service that is unreachable is reported apart from a bad photograph

## Tier 2 — Infrastructure

- [ ] inf-01 existing listings stay sendable when the catalogue keys stop being required

## Отложено

- [S] ui-01.. экран шага 2 мастера — фронтовая стори 20 в `stories.md`
- [S] пороги нечёткого сопоставления — прогон на реальных выдачах, отдельная задача
