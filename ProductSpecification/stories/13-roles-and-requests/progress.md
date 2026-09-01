# 13 — Роли и заявки: manager, importer

## Spec

- [x] interview
- [S] mockups — экран заявок и форма уже в `ui/mockups/index.html`
- [x] api-spec
- [x] test-spec

## Tier 1 — Backend

- [ ] api-01 a user asks to become an importer
- [ ] api-02 approving a request grants the role
- [ ] api-03 a rejection carries a comment and grants nothing
- [ ] api-05 a decided request is not decided again
- [ ] api-06 a moderator does not hand out their own level
- [ ] api-08 one live request per role
- [ ] api-13 an importer keeps what a user could do

## Tier 1 — Security

- [ ] sec-01 a guest asks for nothing
- [ ] sec-02 an ordinary user does not read the queue or decide
- [ ] sec-03 a moderator cannot promote themselves through a request

- [ ] harvest

## Tier 2 — Backend

- [ ] api-04 a rejection without a comment is refused
- [ ] api-07 an administrator may hand out any role
- [ ] api-09 a refusal is not the end of the road
- [ ] api-10 asking for a role one already holds
- [ ] api-11 the moderator sees the queue with names
- [ ] api-12 the queue narrows by status
- [ ] api-14 taking the role away leaves the listings alone
- [ ] api-15 a request for nobody is not found

## Tier 2 — Security

- [ ] sec-04 role routes refuse a caller who has not signed in
- [ ] sec-05 only an administrator sets a role directly

## Tier 2 — Integration

- [ ] int-01 from asking to publishing under the new role

## Отложено

- [S] профиль поставщика — история 16, здесь только право на него
- [S] объявления под привоз — история 17
- [S] повышенные лимиты для поставщика — лимитов нет ни у кого, кроме гостя
- [S] уведомление о решении — уведомлений нет ни в одной истории
