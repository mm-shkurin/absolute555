# Integration Tests — Модерация: очередь, отклонение с причиной, жалобы

### 1. A listing walks the whole loop and the queue follows it
Tier: 1 (hz-04)
```gherkin
Given a complete draft listing
When its seller sends it for review
Then it is waiting in the queue
When a moderator publishes it
Then it is out of the queue and in the feed
When a reader complains and a moderator takes it down
Then it is out of the feed and its seller sees why
When the seller corrects it and sends it again
Then it is waiting in the queue once more
```
