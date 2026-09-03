# API Tests (Tier 3) — Модерация

Записано и не строится. Страницы у очереди — тот же механизм, что у ленты, и он уже
проверен там на пяти сценариях (`07-feed-and-listing-card`). Второй набор проверял бы
ту же функцию с другого маршрута.

### 19. The queue is paged like the feed
Tier: 3
```gherkin
Given twenty-five listings waiting for review
When a moderator asks for the queue five at a time
Then five come back
And the count says twenty-five
And no listing appears on two pages
```
