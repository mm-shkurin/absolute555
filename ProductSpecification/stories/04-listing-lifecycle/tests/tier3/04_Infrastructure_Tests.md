# Infrastructure Tests — Объявление: черновик и жизненный цикл статусов — Tier 3

Recorded, never built.

### 2. The migration is reversible
Tier: 3 (hz-04)
```gherkin
Given a database migrated forward to the six statuses
When the schema is migrated back one step
Then the migration completes without error
```

### 3. The listing routes are reachable under the versioned prefix
Tier: 3
```gherkin
Given the running application
When the route table is read
Then the lifecycle actions are mounted under the versioned listing prefix
And no route on a single status remains
```
