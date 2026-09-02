# Integration Tests — Офферы

### 1. Accepting an offer moves the listing and the offers together or not at all
Tier: 1 (hz-02)
```gherkin
Given a published listing with three waiting offers
When accepting one of them fails midway
Then the listing is still published
And all three offers are still waiting
```
