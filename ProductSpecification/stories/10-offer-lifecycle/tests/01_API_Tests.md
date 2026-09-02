# API Tests — Офферы: отзыв, истечение, автоотклонение при продаже

### 1. A buyer sees what they sent, a seller sees what they were sent
Tier: 1
```gherkin
Given a published listing and a buyer who has offered a price for it
When the buyer asks for the offers they sent
Then that offer is in the answer
When the seller asks for the offers they received
Then the same offer is in that answer
And neither side sees the other's list
```

### 2. A buyer withdraws an offer the seller has not answered
Tier: 1
```gherkin
Given a buyer with a live offer on a listing
When the buyer withdraws it
Then the offer reads as withdrawn
And the seller no longer has it waiting
```

### 3. Withdrawing is not a ban on bargaining
Tier: 2
```gherkin
Given a buyer who has withdrawn their offer on a listing
When the buyer offers a different price for the same listing
Then the new offer is accepted and waiting
```

### 4. Only the buyer withdraws their own offer
Tier: 2
```gherkin
Given a buyer with a live offer on a listing
When the seller tries to withdraw it
Then the request is refused
And the offer is still waiting
```

### 5. A settled offer cannot be withdrawn
Tier: 2
```gherkin
Given an offer the seller has already rejected
When its buyer withdraws it
Then the request is refused
And the offer still reads as rejected
```

### 6. Accepting one offer sells the car and closes the rest
Tier: 1
```gherkin
Given a published listing with three offers from three buyers
When the seller accepts one of them
Then that offer reads as accepted
And the listing is sold
And the other two read as the car having been sold, not as rejected
```

### 7. A sold car leaves the feed the moment the offer is accepted
Tier: 1
```gherkin
Given a published listing with a waiting offer
When the seller accepts it
Then the listing is not in the feed
And its card is still readable and says it is sold
```

### 8. Rejecting one offer leaves the others alone
Tier: 2
```gherkin
Given a published listing with two waiting offers
When the seller rejects one of them
Then that one reads as rejected
And the other is still waiting
And the listing is still published
```

### 9. An offer is settled once
Tier: 2
```gherkin
Given an offer the seller has already accepted
When the seller rejects it
Then the request is refused
And it still reads as accepted
```

### 10. An offer expires by itself when nobody answers
Tier: 1
```gherkin
Given an offer whose life has run out
When the expiry runs
Then the offer reads as expired
And the seller no longer has it waiting
```

### 11. An expired offer cannot be accepted
Tier: 1
```gherkin
Given an offer that has expired
When the seller accepts it
Then the request is refused
And the listing is not sold
```

### 12. The expiry leaves alone what is still in time
Tier: 2
```gherkin
Given one offer whose life has run out and one made just now
When the expiry runs
Then the first reads as expired
And the second is still waiting
```

### 13. The expiry does not touch what was already settled
Tier: 2
```gherkin
Given an accepted offer and a withdrawn one, both older than an offer's life
When the expiry runs
Then the accepted one still reads as accepted
And the withdrawn one still reads as withdrawn
```

### 14. An offer carries the moment it will expire
Tier: 2
```gherkin
Given a buyer making an offer on a published listing
When the offer comes back
Then it names when it will expire
And that moment is three days away
```

### 15. There is nothing to bargain over until a listing is published
Tier: 1
```gherkin
Given a draft listing and a listing taken down by a moderator
When a signed-in buyer offers a price for either of them
Then the request is reported as not found
```

### 16. A sold listing takes no new offers
Tier: 2
```gherkin
Given a listing that has been sold
When a signed-in buyer offers a price for it
Then the request is reported as not found
```

### 17. A guest does not bargain
Tier: 2
```gherkin
Given a published listing
When a guest offers a price for it
Then the request is refused
And no offer is recorded
```

### 18. Running the expiry twice changes nothing the second time
Tier: 2
```gherkin
Given an offer whose life has run out
When the expiry runs twice
Then the offer reads as expired
And its moment of expiry has not moved
```
