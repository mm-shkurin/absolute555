# Integration Tests — Объявление: черновик и жизненный цикл статусов

### 1. A status change is announced to the Telegram channel
Tier: 2
```gherkin
Given a seller with a published listing
And a Telegram webhook that records what it receives
When the seller marks the listing sold
Then the webhook receives one announcement
And the announcement names the previous status and the new one
```

### 2. A failing announcement does not undo the status change
Tier: 2 (hz-02)
```gherkin
Given a seller with a published listing
And a Telegram webhook that fails on every call
When the seller marks the listing sold
Then the action succeeds
And the listing is in status "sold"
```

### 3. Sending a draft for review does not wait on photo storage
Tier: 2 (promoted)
```gherkin
Given a seller with a complete draft
And photo storage that is unreachable
When the seller sends the draft for review
Then the listing is in status "moderation"
And the answer carries no photo links
```

### 4. A make resolved by the catalogue satisfies the completeness check
Tier: 2 (promoted)
```gherkin
Given a seller with a draft whose make and model were resolved from a document
When the seller sends the draft for review
Then the listing is in status "moderation"
And the completeness check does not ask for a make or a model
```
