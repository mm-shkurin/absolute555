# Infrastructure Tests — Фото объявления: загрузка, порядок, обложка — Tier 3

Recorded, never built.

### 1. Two stores exist, and only one of them is public
Tier: 3
```gherkin
Given the running application
When the stores it uses are inspected
Then the gallery store serves its objects to anyone who asks
And the document store serves nothing without a signature
```

### 3. Photographs already stored keep working under the new gallery
Tier: 3 (hz-04)
```gherkin
Given listings whose photographs were stored before this story
When the schema is migrated forward
Then each of those listings returns its photographs in a stable order
And the first one is its cover
```

### 4. The address photographs are served from is configuration, not code
Tier: 3
```gherkin
Given the application configured with a public photo address
When a listing's photographs are read
Then their links use that address
```
