# Integration Tests — Чат

### 1. A message written on one connection reaches the other side live
Tier: 1
```gherkin
Given a buyer and a seller both connected to the live channel
When the buyer writes a message
Then the seller's connection receives it without asking for it
```
