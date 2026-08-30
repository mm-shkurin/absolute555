# Infrastructure Tests — Объявление: черновик и жизненный цикл статусов — Tier 3

Recorded, never built.

### 2. The migration is reversible
Tier: 3 (hz-04)
```gherkin
Given a database migrated forward to the six statuses
When the schema is migrated back one step
Then the migration completes without error
```

