# Infrastructure Tests — Фото объявления: загрузка, порядок, обложка

### 2. Documents already in the database move to the closed store
Tier: 2 (hz-04)
```gherkin
Given a database holding listings whose registration scans sit in the listing row
When the schema is migrated forward
Then no listing row carries a scan
And each scan that was there is in the closed store
```

