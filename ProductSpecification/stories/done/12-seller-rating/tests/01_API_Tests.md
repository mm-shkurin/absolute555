# API Tests — Рейтинг продавца и публичный профиль

### 1. A buyer rates the seller after an accepted offer
Tier: 1
```gherkin
Given an offer the seller has accepted
When its author rates the seller four stars with a few words
Then the review is recorded against that seller
And it names the offer it came from
```

### 2. A review without a deal is refused
Tier: 1
```gherkin
Given an offer that is still waiting for an answer
When its author tries to rate the seller
Then the attempt is reported as a conflict
And the seller has no reviews
```

### 3. Somebody else's offer is not a way in
Tier: 2
```gherkin
Given an accepted offer between a buyer and a seller
When a third signed-in person rates the seller through that offer
Then the attempt is reported as not found
```

### 4. One deal, one review
Tier: 2
```gherkin
Given a buyer who has already rated a seller for an accepted offer
When the buyer rates the seller again through the same offer
Then the attempt is reported as a conflict
And the answer names the review already written
```

### 5. The seller carries an average and a count
Tier: 1
```gherkin
Given a seller rated five and three by two different buyers
When anyone reads that seller
Then the rating reads four
And the number of reviews reads two
```

### 6. A seller nobody has rated has no rating
Tier: 1
```gherkin
Given a seller with no reviews
When anyone reads that seller
Then there is no rating rather than a rating of zero
And the number of reviews reads zero
```

### 7. The listing card carries the seller's rating
Tier: 1
```gherkin
Given a published listing whose seller has been rated
When anyone opens the listing
Then the seller block carries the rating, the number of reviews and the number of deals
```

### 8. The moderation queue row carries it too
Tier: 1
```gherkin
Given a listing waiting for moderation whose seller has been rated
When a moderator reads the queue
Then the row's seller carries the same rating
```

### 9. The offers screen knows whether a review can be left
Tier: 1
```gherkin
Given a buyer with one accepted offer and one still pending
When the buyer reads their offers
Then the accepted one may be reviewed and the pending one may not
```

### 10. The offers screen knows a review was already left
Tier: 1
```gherkin
Given a buyer who has rated a seller for an accepted offer
When the buyer reads their offers
Then that offer names the review and no longer invites a new one
```

### 11. A review may be corrected within a day
Tier: 2
```gherkin
Given a review written an hour ago
When its author changes it to five stars
Then the review reads five stars
And the seller's average is recalculated
```

### 12. After a day the review is settled
Tier: 2
```gherkin
Given a review written two days ago
When its author tries to change it
Then the attempt is reported as a conflict
And the review is unchanged
```

### 13. Only the author corrects a review
Tier: 2
```gherkin
Given a review written by a buyer
When another signed-in person tries to change it
Then the attempt is reported as not found
```

### 14. A rating outside one to five is refused
Tier: 2
```gherkin
Given an accepted offer
When its author rates the seller zero, six, or with no rating at all
Then every attempt is refused as invalid
And the seller has no reviews
```

### 15. Words are optional
Tier: 2
```gherkin
Given an accepted offer
When its author rates the seller five stars without writing anything
Then the review is recorded
```

### 16. Deals counted are accepted offers, not reviews
Tier: 2
```gherkin
Given a seller with three accepted offers and one review
When anyone reads that seller
Then the number of deals reads three and the number of reviews reads one
```

### 17. The public profile is readable without signing in
Tier: 1
```gherkin
Given a seller with reviews and published listings
When a visitor who has not signed in opens the seller's profile
Then the profile carries the rating, the number of deals and how many listings are published
```

### 18. The profile lists the seller's reviews newest first
Tier: 2
```gherkin
Given a seller rated by three buyers on different days
When anyone reads the seller's reviews
Then the most recent review comes first
And each review names who wrote it
```

### 19. The profile shows only published listings
Tier: 2
```gherkin
Given a seller with one published listing, one draft and one rejected
When anyone reads the seller's listings
Then only the published one is listed
```

### 20. A profile of nobody is not found
Tier: 2
```gherkin
Given an identifier belonging to no user
When anyone opens that profile
Then the request is reported as not found
```
