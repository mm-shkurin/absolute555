# Security Tests — Фото объявления: загрузка, порядок, обложка — Tier 3

Recorded, never built.

### 4. A moderator may read the document while the listing is under review
Tier: 3 (sec:IDOR)
```gherkin
Given a listing under review carrying a scan of the registration document
When a moderator asks for a link to that scan
Then a link is returned
And it carries the moment it stops working
```

### 7. A filename cannot decide where the file is written
Tier: 3 (sec:PathTraversal)
```gherkin
Given a seller with a draft listing
When the seller uploads a photograph whose filename walks out of its folder
Then the stored photograph belongs to that listing and nowhere else
And no other listing's gallery changes
```

### 8. A failure does not name the storage behind it
Tier: 3 (sec:InfoLeak, hz-07)
```gherkin
Given a seller with a draft listing
When an upload fails because the store cannot be reached
Then the refusal says the upload failed
And it names no bucket, no key and no internal address
```
