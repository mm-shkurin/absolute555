# Infrastructure Tests — Объявление: черновик и жизненный цикл статусов

### 1. Existing listings survive the move to the six statuses
Tier: 2 (hz-04)
```gherkin
Given a database holding listings in the retired statuses "on_sale" and "sold"
And listings whose price, mileage and phone number are all filled
When the schema is migrated forward
Then every "on_sale" listing is in status "published"
And every "sold" listing is still in status "sold"
And no listing holds a retired status
And a listing may now be stored with no price, no mileage and no phone number
```

