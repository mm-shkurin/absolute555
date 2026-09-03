# 11 — Чат покупателя и продавца, непрочитанные

## Spec

- [x] interview
- [S] mockups — экран чатов уже в `ui/mockups/index.html`
- [x] api-spec
- [x] test-spec

## Tier 1 — Backend

- [x] api-01 making an offer opens the conversation
- [x] api-03 either side writes and both see it
- [x] api-05 a dialogue belongs to its two participants and to nobody else
- [x] api-07 reading marks the messages that were named

## Tier 1 — Integration

- [S] int-01 a message written on one connection reaches the other side live

## Tier 1 — Security

- [x] sec-01 a stranger cannot read or write in a dialogue
- [x] sec-02 every chat route refuses a caller who has not signed in
- [x] sec-03 a live connection without a token is closed
- [x] sec-04 a live connection carries only its own dialogues
- [x] sec-05 the recognition stream stops being open to whoever knows an identifier

- [x] harvest

## Tier 2 — Backend

- [x] api-02 a second offer joins the same conversation
- [x] api-04 messages arrive in the order they were written
- [x] api-06 a message written by the other side counts as unread
- [x] api-08 marking your own message read changes nothing
- [x] api-09 marking the same message twice does not move when it was read
- [x] api-10 the badge counts every dialogue at once
- [x] api-11 accepting an offer says so in the conversation
- [x] api-12 a buyer whose car was sold to somebody else is told in the conversation
- [x] api-13 a client cannot write a system line
- [x] api-14 an empty message is refused
- [x] api-15 a sold listing leaves the conversation open
- [x] api-16 a dialogue names the listing and the other person
- [x] api-17 the dialogue list is ordered by the last thing said

## Tier 2 — Security

- [x] sec-06 the phone number never leaks through a dialogue

## Tier 2 — Infrastructure

- [x] inf-01 a pair talks in one dialogue about one listing

## Tier 1 — Frontend

- [x] fe-01 dialogues are listed with the last message and the unread count
- [x] fe-02 on a phone the conversation replaces the list and the back button returns to it
- [x] fe-03 a sent message appears in the thread without reloading the screen

## Отложено

- [S] int-01 — сквозной путь разрезан надвое и покрыт по частям: запись отдаёт сообщение
  в канал (`test_chat.py`), канал доносит его до сокета (`test_chat_socket.py`). Целиком
  через TestClient не проверить: очередь принадлежит его циклу, будить её из потока теста
  нечем, и тест виснет

- [S] вложения и фото в чате — не нарисованы на экране
- [S] push и почта — отдельная история
- [S] чат модератора с продавцом с экрана жалоб — связь модерации, отдельная история
