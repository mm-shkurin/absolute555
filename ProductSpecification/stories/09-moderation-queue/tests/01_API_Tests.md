# API Tests — Модерация: очередь, отклонение с причиной, жалобы

### 1. The queue holds what is waiting, oldest first
Tier: 1
```gherkin
Given three listings sent for review, one after another
When a moderator opens the queue
Then all three are in it
And the one sent first is at the top
And the count says three
```

### 2. The queue holds nothing that is not waiting
Tier: 1
```gherkin
Given a draft listing, a published one and a rejected one
When a moderator opens the queue of listings waiting
Then none of the three is in it
```

### 3. A rejection carries a label the seller can act on
Tier: 1
```gherkin
Given a listing waiting for review
When a moderator rejects it as showing photographs of another car
  and writes what to fix
Then the listing is rejected
And its seller sees both the label and the text
```

### 4. A rejection without a label is refused
Tier: 2
```gherkin
Given a listing waiting for review
When a moderator rejects it with only a written comment
Then the request is refused
And the listing is still waiting
```

### 5. A label the moderator invented is refused
Tier: 2
```gherkin
Given a listing waiting for review
When a moderator rejects it with a label that is not one of the five
Then the request is refused
And the listing is still waiting
```

### 6. A rejected listing is corrected and comes back
Tier: 2
```gherkin
Given a listing rejected as having too few photographs
When its seller adds photographs and sends it for review again
Then it is waiting in the queue again
And it no longer carries the earlier reason
```

### 7. Anyone signed in may complain about a published listing
Tier: 1
```gherkin
Given a published listing
When a signed-in reader complains that the price is bait
Then the complaint is recorded against that listing
And it is open
```

### 8. One person complains about one listing once
Tier: 1
```gherkin
Given a published listing a reader has already complained about
When the same reader complains about it again
Then the request is refused
And the listing still carries one complaint
```

### 9. A seller cannot complain about their own listing
Tier: 2
```gherkin
Given a published listing
When its seller complains about it
Then the request is refused
```

### 10. There is nothing to complain about until a listing is published
Tier: 2
```gherkin
Given a draft listing
When a signed-in reader complains about it
Then the request is reported as not found
```

### 11. Complaints reach the moderator grouped by listing
Tier: 1
```gherkin
Given a published listing two different readers have complained about
When a moderator opens the open complaints
Then the listing appears once
And both complaints are under it, each naming its author and reason
```

### 12. Taking a listing down answers its complaints in one decision
Tier: 1
```gherkin
Given a published listing carrying two open complaints
When a moderator takes it down as a bait price
Then the listing is rejected and its seller sees the reason
And it is gone from the feed
And no open complaint is left against it
```

### 13. A complaint the moderator disagrees with is closed as unfounded
Tier: 2
```gherkin
Given a published listing carrying one open complaint
When a moderator dismisses that complaint
Then it is no longer open
And the listing is still published
```

### 14. A complaint is settled once
Tier: 2
```gherkin
Given a complaint a moderator has already dismissed
When a moderator dismisses it again
Then the request is refused
```

### 15. Nothing is taken down by the number of complaints alone
Tier: 2
```gherkin
Given a published listing
When five different readers complain about it
Then it is still published
And it is still in the feed
```

### 16. A listing that is not published cannot be taken down
Tier: 2
```gherkin
Given a listing waiting for review
When a moderator takes it down
Then the request is refused as not allowed in this state
```

### 17. The tabs count what they say they count
Tier: 2
```gherkin
Given two listings waiting for review and one published listing with a complaint
When a moderator reads the counts
Then the waiting count is two
And the complained count is one
When the moderator rejects one of the waiting listings
Then the waiting count is one
And the count handled today has risen by one
```

### 18. The complained tab holds the listings that were complained about
Tier: 2
```gherkin
Given a published listing with an open complaint and another with none
When a moderator opens the complained tab
Then only the first is in it
And it says how many complaints are open against it
```
