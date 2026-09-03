# Infrastructure Tests — Роли и заявки: manager, importer

### 1. The role a request grants survives a restart
Tier: 3
```gherkin
Given an approved request that granted the importer role
When the application is restarted
Then the person still holds the importer role
```
