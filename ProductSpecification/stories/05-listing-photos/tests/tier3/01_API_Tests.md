# API Tests — Фото объявления: загрузка, порядок, обложка — Tier 3

Recorded, never built.

### 19. Removing a photograph that is already gone changes nothing
Tier: 3 (hz-02)
```gherkin
Given a seller with a draft listing holding two photographs
When the seller removes the first one
And the seller removes it again
Then the second removal reports it was not found
And the gallery still holds one photograph
```

### 20. A photograph of exactly the limit is accepted
Tier: 3 (hz-01)
```gherkin
Given a seller with a draft listing
When the seller uploads a photograph of exactly ten megabytes
Then the gallery holds it
When the seller uploads a photograph one byte larger
Then the upload is refused
```

### 21. The same photograph sent twice becomes two entries
Tier: 3 (hz-02)
```gherkin
Given a seller with a draft listing
When the seller uploads one file
And the seller uploads the same file again
Then the gallery holds two photographs
And each has its own identity
```

### 22. An order sent while a photograph is being removed does not half-apply
Tier: 3 (hz-03)
```gherkin
Given a seller with a draft listing holding three photographs
When the seller removes one and sends an order naming all three at the same moment
Then either the order is refused as not matching, or it is applied to what remains
And the gallery never ends up in an order naming a photograph that is gone
```
