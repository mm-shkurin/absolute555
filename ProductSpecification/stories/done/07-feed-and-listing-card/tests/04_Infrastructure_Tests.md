# Infrastructure Tests — Лента и карточка объявления

### 1. The columns the feed filters on are indexed
Tier: 2 (hz-06)
```gherkin
Given a migrated database
When the indexes of the listings table are read
Then status, make, model, year, price and mileage are each covered by one
```
