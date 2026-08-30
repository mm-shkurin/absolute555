# Security Tests — Объявление: черновик и жизненный цикл статусов

### 1. A stranger cannot see that someone else's draft exists
Tier: 1 (sec:IDOR)
```gherkin
Given a seller with a draft listing
And another signed-in user
When the other user opens that listing by its identifier
Then the listing is reported as not found
And nothing in the answer distinguishes it from an identifier that was never issued
```

### 2. A stranger cannot move someone else's listing through its lifecycle
Tier: 2 (sec:IDOR)
```gherkin
Given a seller with a published listing
And another signed-in user
When the other user withdraws that listing
Then the action is reported as not found
And the listing is still published
```

### 3. Lifecycle actions require a signed-in user
Tier: 2 (sec:JWT)
```gherkin
Given a published listing
When an unauthenticated caller withdraws it
Then the call is refused as unauthenticated
And the listing is still published
```

### 4. A listing under review is hidden from strangers as a draft is
Tier: 2 (promoted) (sec:IDOR)
```gherkin
Given a seller with a listing under review
And another signed-in user
When the other user opens that listing by its identifier
Then the listing is reported as not found
```

### 5. A rejection reason is not disclosed outside the owner
Tier: 2 (promoted) (sec:IDOR)
```gherkin
Given a seller with a rejected listing carrying a moderator's reason
And another signed-in user
When the other user opens that listing by its identifier
Then the listing is reported as not found
And the reason is nowhere in the answer
```

### 6. An identifier that is not a listing identifier is rejected as input
Tier: 2 (promoted) (sec:SQLi)
```gherkin
Given a signed-in seller
When the seller opens a listing by an identifier that is not a well-formed one
Then the call is refused as malformed input
And no listing is returned
```
