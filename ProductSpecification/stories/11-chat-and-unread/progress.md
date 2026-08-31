# 11 — Чат покупателя и продавца, непрочитанные

## Spec

- [x] interview
- [S] mockups — экран чатов уже в `ui/mockups/index.html`
- [x] api-spec
- [x] test-spec

## Tier 1 — Backend

- [~] api-01 making an offer opens the conversation
- [ ] api-03 either side writes and both see it
- [ ] api-05 a dialogue belongs to its two participants and to nobody else
- [ ] api-07 reading marks the messages that were named

## Tier 1 — Integration

- [ ] int-01 a message written on one connection reaches the other side live

## Tier 1 — Security

- [ ] sec-01 a stranger cannot read or write in a dialogue
- [ ] sec-02 every chat route refuses a caller who has not signed in
- [ ] sec-03 a live connection without a token is closed
- [ ] sec-04 a live connection carries only its own dialogues
- [ ] sec-05 the recognition stream stops being open to whoever knows an identifier

- [ ] harvest

## Tier 2 — Backend

- [ ] api-02 a second offer joins the same conversation
- [ ] api-04 messages arrive in the order they were written
- [ ] api-06 a message written by the other side counts as unread
- [ ] api-08 marking your own message read changes nothing
- [ ] api-09 marking the same message twice does not move when it was read
- [ ] api-10 the badge counts every dialogue at once
- [ ] api-11 accepting an offer says so in the conversation
- [ ] api-12 a buyer whose car was sold to somebody else is told in the conversation
- [ ] api-13 a client cannot write a system line
- [ ] api-14 an empty message is refused
- [ ] api-15 a sold listing leaves the conversation open
- [ ] api-16 a dialogue names the listing and the other person
- [ ] api-17 the dialogue list is ordered by the last thing said

## Tier 2 — Security

- [ ] sec-06 the phone number never leaks through a dialogue

## Tier 2 — Infrastructure

- [ ] inf-01 a pair talks in one dialogue about one listing

## Отложено

- [S] вложения и фото в чате — не нарисованы на экране
- [S] push и почта — отдельная история
- [S] чат модератора с продавцом с экрана жалоб — связь модерации, отдельная история
