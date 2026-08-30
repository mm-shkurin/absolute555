# Integration Tests — Фото объявления: загрузка, порядок, обложка — Tier 3

Recorded, never built.

### 3. A rejected listing also loses its document
Tier: 3
```gherkin
Given a listing under review carrying a scan of its registration document
When a moderator rejects the listing
Then the scan is no longer stored
```

### 4. An unreachable photo store fails the upload rather than the listing
Tier: 3
```gherkin
Given a seller with a draft listing holding two photographs
And a photo store that cannot be reached
When the seller uploads a photograph
Then the upload is refused
And the listing still holds its two photographs and its other fields
```

### 5. Deleting a listing takes its photographs and its document with it
Tier: 3
```gherkin
Given a seller with a draft listing holding three photographs and a document scan
When the seller deletes the listing
Then none of the photographs remain in storage
And the document does not remain either
```
