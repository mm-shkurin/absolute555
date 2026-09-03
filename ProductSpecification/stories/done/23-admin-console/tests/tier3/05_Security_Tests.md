# Security Tests (Tier 3, recorded not built) — Админка: люди, роли, блокировки, сводка

### 4. An unsigned caller reaches nothing
Tier: 3 (sec:JWT)
```gherkin
Given a caller with no token
When they ask for any of the admin routes
Then every attempt is refused as unauthenticated
```
