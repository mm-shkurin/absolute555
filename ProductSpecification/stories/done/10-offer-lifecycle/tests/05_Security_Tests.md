# Security Tests — Офферы

### 1. Only the seller settles an offer on their listing
Tier: 1 (sec:AuthZ)
```gherkin
Given a published listing with a waiting offer
When a signed-in stranger accepts it
Then the request is refused
When the buyer who made it accepts it
Then the request is refused
And the offer is still waiting and the listing still published
```

### 2. Offers of others are not readable through either tab
Tier: 1 (sec:IDOR)
```gherkin
Given two buyers with offers on two different sellers' listings
When one buyer reads both tabs
Then only their own offer and offers on their own listings are in the answer
```

### 3. Every offer route refuses a caller who has not signed in
Tier: 2 (sec:JWT)
```gherkin
Given a published listing with a waiting offer
When an unauthenticated caller makes, reads, settles or withdraws an offer
Then each request is refused as unauthenticated
```
