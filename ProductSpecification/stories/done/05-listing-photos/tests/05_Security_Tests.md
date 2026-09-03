# Security Tests — Фото объявления: загрузка, порядок, обложка

### 1. A stranger cannot touch someone elses gallery
Tier: 1 (sec:IDOR)
```gherkin
Given a seller with a listing holding three photographs
And another signed-in user
When the other user uploads a photograph to that listing
Then the request is reported as not found
When the other user sends a new order for the photographs
Then the request is reported as not found
When the other user removes one of them
Then the request is reported as not found
And the gallery is unchanged
```

### 2. Photograph upload requires a signed-in caller
Tier: 2 (sec:JWT)
```gherkin
Given a draft listing
When an unauthenticated caller uploads a photograph to it
Then the call is refused as unauthenticated
```

### 3. The registration document is not readable by a stranger
Tier: 2 (sec:IDOR)
```gherkin
Given a seller whose listing carries a scan of the registration document
And another signed-in user
When the other user asks for a link to that scan
Then the request is reported as not found
And no link appears anywhere in the answer
```

### 5. A link to the document stops working when it expires
Tier: 2 (sec:Expiry, hz-07)
```gherkin
Given a seller who has been given a link to their registration document
When the link's moment passes
And anyone follows the link
Then the document is not served
```

### 6. The document is not readable without a signature
Tier: 2 (sec:BucketPolicy)
```gherkin
Given a listing whose registration document is stored
When anyone requests that document from storage without a signature
Then it is not served
And a photograph from the same listing's gallery, requested the same way, is served
```

