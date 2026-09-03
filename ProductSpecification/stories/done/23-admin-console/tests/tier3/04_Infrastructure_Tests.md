# Infrastructure Tests (Tier 3, recorded not built) — Админка: люди, роли, блокировки, сводка

### 1. The block and its journal survive a restart
Tier: 3
```gherkin
Given a seller blocked with a reason
When the application is restarted
Then the seller is still blocked and the journal still names why
```
