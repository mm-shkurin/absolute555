# Security Tests — Автозаполнение из СТС: привязка к справочнику

### 1. A stranger cannot attach a document to a listing that is not theirs
Tier: 1 (sec:IDOR)
```gherkin
Given a seller with a draft listing
And another signed-in user
When the other user attaches a registration photograph to that listing
Then the request is reported as not found
And the listing carries no scan
And no reading was started
```

### 2. Attaching a document requires a signed-in caller
Tier: 2 (sec:JWT)
```gherkin
Given a draft listing
When an unauthenticated caller attaches a registration photograph to it
Then the call is refused as unauthenticated
```

### 3. Nobody outside the reading can set a listing recognition outcome
Tier: 1 (sec:MassAssignment, hz-05)
```gherkin
Given a seller with a draft listing whose recognition is running
When the seller saves the listing fields and includes a recognition outcome of done
Then the saved listing still reports the recognition as running
When an unauthenticated caller tries to set the recognition outcome of any listing
Then no route accepts it
```
