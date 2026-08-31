# Infrastructure Tests — Офферы

### 1. Offers made before the statuses grew keep their meaning
Tier: 2 (hz-04)
```gherkin
Given a database holding offers that are pending, accepted and rejected
When the schema is migrated forward
Then each of them still reads as what it was
And each pending one has been given a moment of expiry
```

### 2. The expiry runs on its own schedule
Tier: 2 (hz-02)
```gherkin
Given the worker is running
When its schedule is read
Then the expiry of offers is on it
```
