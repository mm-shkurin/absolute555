# API Tests — Объявление: черновик и жизненный цикл статусов

### 1. Seller creates an empty draft
Tier: 1
```gherkin
Given a signed-in seller with no listings
When the seller creates a listing
Then the listing exists in status "draft"
And it appears in the seller's own listings
```

### 2. Seller saves part of a listing and returns to it later
Tier: 1
```gherkin
Given a seller with a draft holding only a price
When the seller saves a mileage and a phone number on that draft
Then the draft holds the price, the mileage and the phone number
And the draft is still in status "draft"
```

### 3. Seller sends a complete draft for review
Tier: 1
```gherkin
Given a seller with a draft holding a price, a mileage, a phone number,
  a make, a model, a year and one photo
When the seller sends the draft for review
Then the listing is in status "moderation"
```

### 4. Sending an incomplete draft names every missing field at once
Tier: 1
```gherkin
Given a seller with a draft holding only a price and a mileage
When the seller sends the draft for review
Then the listing is refused as incomplete
And the refusal names the phone number, the make, the model, the year and the photo
And the listing is still in status "draft"
```

### 5. Seller withdraws a published listing
Tier: 1
```gherkin
Given a seller with a published listing
When the seller withdraws it
Then the listing is in status "withdrawn"
```

### 6. Seller marks a published listing sold
Tier: 1
```gherkin
Given a seller with a published listing
When the seller marks it sold
Then the listing is in status "sold"
```

### 7. Seller returns a withdrawn listing through review
Tier: 1
```gherkin
Given a seller with a withdrawn listing
When the seller returns it to sale
Then the listing is in status "moderation"
And the listing is not visible in the public feed
```

### 8. A transition the current status does not allow is refused
Tier: 1
```gherkin
Given a seller with a draft listing
When the seller marks it sold
Then the action is refused as an impossible transition
And the refusal names "draft" as the current status
And the refusal names "moderation" as what is reachable from it
And the listing is still in status "draft"
```

### 9. Seller reads own listings one basket at a time
Tier: 1
```gherkin
Given a seller with one draft, one listing under review and two published listings
When the seller reads own listings filtered by "published"
Then exactly the two published listings are returned
```

### 10. A seller may hold no more than five drafts
Tier: 2 (hz-06)
```gherkin
Given a seller holding five drafts
When the seller creates another listing
Then the creation is refused
And the refusal names five as the limit
```

### 11. A status sent as an ordinary field is not accepted
Tier: 2 (hz-05)
```gherkin
Given a seller with a draft listing
When the seller saves a status of "published" as a field of that draft
Then the save is refused as an unknown field
And the listing is still in status "draft"
```

### 12. A listing under review cannot be edited
Tier: 2
```gherkin
Given a seller with a listing under review
When the seller saves a new price on it
Then the save is refused
And the listing holds its original price
```

### 13. A rejected listing is corrected as a draft and sent again
Tier: 2
```gherkin
Given a seller with a listing rejected for a stated reason
When the seller returns it to a draft
Then the listing is in status "draft"
And no rejection reason is shown on it
When the seller sends the complete draft for review
Then the listing is in status "moderation"
```

### 14. A listing marked sold by mistake is withdrawn
Tier: 2
```gherkin
Given a seller with a listing marked sold
When the seller withdraws it
Then the listing is in status "withdrawn"
And the listing is not visible in the public feed
```

### 15. A price survives saving and reading unchanged
Tier: 2 (hz-01)
```gherkin
Given a seller with a draft listing
When the seller saves a price of 4 020 000 roubles and 50 kopecks
Then reading the listing returns exactly 4 020 000 roubles and 50 kopecks
```

### 16. Sending the same draft for review twice changes nothing the second time
Tier: 2 (hz-02)
```gherkin
Given a seller with a complete draft
When the seller sends it for review
And the seller sends it for review again
Then the second attempt is refused as an impossible transition
And the listing is in status "moderation"
And the listing entered review once
```

### 17. Two actions arriving together leave one status, not two
Tier: 2 (hz-03)
```gherkin
Given a seller with a published listing
When the seller withdraws it and marks it sold at the same moment
Then exactly one of the two actions succeeds
And the other is refused as an impossible transition
And the listing is in one of "withdrawn" or "sold"
```

### 18. A published listing records when it was published
Tier: 2 (hz-07)
```gherkin
Given a seller with a listing under review
When a moderator approves it
Then the listing is in status "published"
And the listing records the moment it was published
```
