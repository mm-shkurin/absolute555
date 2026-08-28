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

