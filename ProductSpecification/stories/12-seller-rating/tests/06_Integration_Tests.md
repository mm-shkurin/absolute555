# Integration Tests — Рейтинг продавца и публичный профиль

### 1. Accepting an offer and then rating goes end to end
Tier: 3
```gherkin
Given a published listing and a buyer offer
When the seller accepts it and the buyer rates the seller
Then the sellers rating in the listing card changes for every later reader
```
