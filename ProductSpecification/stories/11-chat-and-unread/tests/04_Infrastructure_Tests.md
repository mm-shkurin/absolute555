# Infrastructure Tests — Чат

### 1. A pair talks in one dialogue about one listing
Tier: 2 (hz-03)
```gherkin
Given a migrated database
When the same pair is recorded twice as talking about one listing
Then the second record is refused by the database itself
```
