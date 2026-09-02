# Security Tests — Модерация: очередь, отклонение с причиной, жалобы

### 1. The queue is closed to everyone but a moderator
Tier: 1 (sec:AuthZ)
```gherkin
Given listings waiting for review
When an ordinary signed-in user asks for the queue, the counts and the complaints
Then each request is refused
When a reader who has not signed in asks for them
Then each is refused as unauthenticated
```

### 2. Moderator actions are closed the same way
Tier: 1 (sec:AuthZ)
```gherkin
Given a published listing carrying an open complaint
When an ordinary signed-in user takes it down or dismisses the complaint
Then both requests are refused
And the listing is still published and the complaint still open
```

### 3. A complaint requires signing in
Tier: 2 (sec:JWT)
```gherkin
Given a published listing
When a reader who has not signed in complains about it
Then the request is refused as unauthenticated
And no complaint is recorded
```

### 4. A complaint does not carry its author to the seller
Tier: 2 (sec:DataExposure)
```gherkin
Given a published listing carrying a complaint
When its seller reads the listing
Then nothing in the answer names who complained
```
