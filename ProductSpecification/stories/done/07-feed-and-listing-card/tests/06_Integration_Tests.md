# Integration Tests — Лента и карточка объявления

### 1. A listing enters the feed when it is published and leaves when it is sold
Tier: 1 (hz-04)
```gherkin
Given a complete draft listing
When a moderator publishes it
Then it is in the feed
When its seller marks it sold
Then it is no longer in the feed
And its card is still readable by anyone who has its address
```
