# Infrastructure Tests — Автозаполнение из СТС: привязка к справочнику

### 1. Existing listings stay sendable when the catalogue keys stop being required
Tier: 2 (hz-04)
```gherkin
Given a database holding drafts that carry a document spelling and no catalogue key
When the schema is migrated forward
Then those drafts are unchanged
And each of them can be sent for review without a catalogue make or model
```
