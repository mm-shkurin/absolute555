# Infrastructure Tests — Админка: люди, роли, блокировки, сводка

### 2. The revision that adds the block rolls back
Tier: 2
```gherkin
Given the database at the revision that adds blocking and the journal
When the revision is rolled back and applied again
Then both steps succeed and the schema matches
```
