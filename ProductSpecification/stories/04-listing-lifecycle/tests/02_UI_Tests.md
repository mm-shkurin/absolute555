# UI Tests — Объявление: черновик и жизненный цикл статусов

### 1. My listings are grouped by status
Tier: 2 (hz-08)
```gherkin
Given a seller with one draft, one listing under review, two published listings,
  one rejected listing and one sold listing
When the seller opens "My listings"
Then a basket is shown for each of drafts, under review, published, rejected and sold
And each basket names how many listings it holds
When the seller opens the drafts basket
Then only the draft listing is shown
```

