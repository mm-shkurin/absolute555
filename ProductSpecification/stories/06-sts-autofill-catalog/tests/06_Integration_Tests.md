# Integration Tests — Автозаполнение из СТС: привязка к справочнику

### 1. The reading is handed the stored document, not the bytes
Tier: 2
```gherkin
Given a seller attaching a registration photograph to a draft
When the reading is queued
Then the queued work names the stored document
And the photograph itself is not part of the queued work
```

### 2. A recognition service that is unreachable is reported apart from a bad photograph
Tier: 2 (hz-07)
```gherkin
Given a seller with a draft listing
When the recognition service cannot be reached
Then the recognition is reported as undecoded
And it is not reported as unreadable
And the draft still exists and is still editable
```
