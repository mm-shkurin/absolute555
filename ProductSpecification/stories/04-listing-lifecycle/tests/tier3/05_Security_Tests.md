# Security Tests — Объявление: черновик и жизненный цикл статусов — Tier 3

Recorded, never built.

### 4. A listing under review is hidden from strangers as a draft is
Tier: 3 (sec:IDOR)
```gherkin
Given a seller with a listing under review
And another signed-in user
When the other user opens that listing by its identifier
Then the listing is reported as not found
```

### 5. A rejection reason is not disclosed outside the owner
Tier: 3 (sec:IDOR)
```gherkin
Given a seller with a rejected listing carrying a moderator's reason
And another signed-in user
When the other user opens that listing by its identifier
Then the listing is reported as not found
And the reason is nowhere in the answer
```

### 6. An identifier that is not a listing identifier is rejected as input
Tier: 3 (sec:SQLi)
```gherkin
Given a signed-in seller
When the seller opens a listing by an identifier that is not a well-formed one
Then the call is refused as malformed input
And no listing is returned
```
