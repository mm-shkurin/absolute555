# Integration Tests — Роли и заявки

### 1. From asking to publishing under the new role
Tier: 2
```gherkin
Given a user who asked for the importer role
When a moderator approves it and the person publishes a listing
Then the listing is published and its author holds the importer role
```
