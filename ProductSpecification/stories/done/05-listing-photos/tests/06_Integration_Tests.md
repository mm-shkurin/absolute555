# Integration Tests — Фото объявления: загрузка, порядок, обложка

### 1. The registration document is stored apart from the gallery
Tier: 2
```gherkin
Given a seller uploading a scan of a registration document
When the scan is stored
Then it is held in the closed store, not beside the listing's photographs
And the listing row no longer carries the scan itself
```

### 2. The document is discarded once a moderator has decided
Tier: 2
```gherkin
Given a listing under review carrying a scan of its registration document
When a moderator publishes the listing
Then the scan is no longer stored
And asking for a link to it reports it as not found
```

