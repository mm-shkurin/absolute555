# 16 — Импорт: профиль поставщика

## Spec

- [x] interview
- [S] mockups — экрана поставщика в макете нет, вёрстку ведёт фронтовая полоса
- [x] api-spec
- [x] test-spec

## Tier 1 — Backend

- [x] api-01 a new importer opens an empty profile
- [x] api-02 the profile keeps what was filled in
- [x] api-03 an incomplete profile is refused at the queue
- [x] api-04 a published profile is readable by anyone
- [x] api-05 a profile still waiting is hidden
- [x] api-06 the moderator sees what is waiting
- [x] api-07 a rejection without a reason is refused
- [x] api-08 editing a rejected profile returns it to a draft
- [x] api-09 a profile is frozen while it waits

## Tier 1 — Security

- [x] sec-01 a user without the role reaches no profile routes

## Tier 1 — Frontend

- [x] fe-01 a filled profile goes to the queue and stops being editable there
- [x] fe-02 a rejected profile shows the reason beside the form
- [x] fe-03 the moderator cannot reject a profile without a reason
- [x] fe-04 the public page composes the shopfront, the seller rating and the listings
- [x] fe-05 a profile with no name is signed by the person behind it

## Отложено

- [S] компания с несколькими сотрудниками — отдельная история
- [S] отдельный рейтинг поставщика — агрегат истории 12 отвечает на тот же вопрос
