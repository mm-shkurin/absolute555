# Integration Tests (Tier 3, recorded not built) — Админка: люди, роли, блокировки, сводка

### 2. A person promoted to moderator can work the queue at once
Tier: 3
```gherkin
Given an administrator who makes an ordinary user a moderator with a reason
When that person signs in and opens moderation
Then the queue answers them
And the journal of their account names the promotion
```
