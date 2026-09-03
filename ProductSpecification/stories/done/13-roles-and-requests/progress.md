# 13 — Роли и заявки: manager, importer

## Spec

- [x] interview
- [S] mockups — экран заявок и форма уже в `ui/mockups/index.html`
- [x] api-spec
- [x] test-spec

## Tier 1 — Backend

- [x] api-01 a user asks to become an importer
- [x] api-02 approving a request grants the role
- [x] api-03 a rejection carries a comment and grants nothing
- [x] api-05 a decided request is not decided again
- [x] api-06 a moderator does not hand out their own level
- [x] api-08 one live request per role
- [x] api-13 an importer keeps what a user could do

## Tier 1 — Security

- [x] sec-01 a guest asks for nothing
- [x] sec-02 an ordinary user does not read the queue or decide
- [x] sec-03 a moderator cannot promote themselves through a request

- [x] harvest

## Tier 2 — Backend

- [x] api-04 a rejection without a comment is refused
- [x] api-07 an administrator may hand out any role
- [x] api-09 a refusal is not the end of the road
- [x] api-10 asking for a role one already holds
- [x] api-11 the moderator sees the queue with names
- [x] api-12 the queue narrows by status
- [x] api-14 taking the role away leaves the listings alone
- [x] api-15 a request for nobody is not found

## Tier 2 — Security

- [x] sec-04 role routes refuse a caller who has not signed in
- [x] sec-05 only an administrator sets a role directly

## Tier 2 — Integration

- [x] int-01 from asking to publishing under the new role

## Tier 1 — Frontend

- [x] fe-01 a role application is filled in and sent from the profile
- [x] fe-02 the reviewer sees the pending applications and answers them
- [x] fe-03 a rejection opens the reason field: the applicant must learn what to fix

## Отложено

- [S] профиль поставщика — история 16, здесь только право на него
- [S] объявления под привоз — история 17
- [S] повышенные лимиты для поставщика — лимитов нет ни у кого, кроме гостя
- [S] уведомление о решении — уведомлений нет ни в одной истории
