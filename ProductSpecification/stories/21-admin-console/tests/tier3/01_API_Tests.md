# API Tests (Tier 3, recorded not built) — Админка: люди, роли, блокировки, сводка

### 13. Acting on a person who is not there
Tier: 3
```gherkin
Given an administrator
When they block, unblock or open a card for an account that does not exist
Then each attempt is reported as not found
```

### 14. A blocked person cannot be blocked into losing their journal
Tier: 3
```gherkin
Given a seller blocked and then unblocked twice with different reasons
When an administrator reads the journal
Then every one of those actions is there with its own reason
And no record has been overwritten
```
