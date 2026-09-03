# Security Tests — Рейтинг продавца и публичный профиль

### 1. A guest leaves no reviews
Tier: 1
```gherkin
Given a guest session
When it tries to rate a seller
Then the request is refused
```

### 2. Writing routes refuse a caller who has not signed in
Tier: 2
```gherkin
Given no credentials
When a review is created or corrected
Then both requests are refused as unauthorised
```

### 3. The phone number does not leak through a profile
Tier: 2
```gherkin
Given a seller whose listings carry a phone number
When anyone reads the seller's public profile
Then the answer carries no phone number
```

### 4. A review cannot be written against a seller of one's choosing
Tier: 2
```gherkin
Given an accepted offer between a buyer and one seller
When its author tries to name a different seller in the body
Then the review still belongs to the seller of that offer
```

### 5. A seller cannot rate themselves
Tier: 2
```gherkin
Given a seller
When the seller tries to rate their own listing's deal
Then the attempt is refused
```
