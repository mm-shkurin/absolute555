# Integration Tests — Объявление: черновик и жизненный цикл статусов — Tier 3

Recorded, never built.

### 3. Sending a draft for review does not wait on photo storage
Tier: 3
```gherkin
Given a seller with a complete draft
And photo storage that is unreachable
When the seller sends the draft for review
Then the listing is in status "moderation"
And the answer carries no photo links
```

### 4. A make resolved by the catalogue satisfies the completeness check
Tier: 3
```gherkin
Given a seller with a draft whose make and model were resolved from a document
When the seller sends the draft for review
Then the listing is in status "moderation"
And the completeness check does not ask for a make or a model
```
