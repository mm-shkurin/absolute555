# Infrastructure Tests — Модерация: очередь, отклонение с причиной, жалобы

### 1. One person cannot hold two complaints about one listing
Tier: 2 (hz-03)
```gherkin
Given a migrated database
When the same reader is recorded twice as complaining about one listing
Then the second record is refused by the database itself
```

### 2. Listings rejected before the labels existed keep their text
Tier: 2 (hz-04)
```gherkin
Given a database holding listings rejected with a written reason and no label
When the schema is migrated forward
Then each of them still carries its written reason
And its seller still reads it
```
