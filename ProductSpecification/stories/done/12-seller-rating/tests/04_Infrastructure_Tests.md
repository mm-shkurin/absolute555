# Infrastructure Tests — Рейтинг продавца и публичный профиль

### 1. One review per offer, enforced by the database
Tier: 2
```gherkin
Given a review already recorded for an offer
When a second review for the same offer is written straight to storage
Then the database refuses it
```

### 2. The rating migration rolls back
Tier: 3
```gherkin
Given the revision that adds reviews and the seller aggregate
When it is rolled back and applied again
Then both directions succeed
```
