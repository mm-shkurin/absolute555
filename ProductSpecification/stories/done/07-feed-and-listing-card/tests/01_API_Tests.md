# API Tests — Лента и карточка объявления

### 1. The feed answers with a page and an honest count
Tier: 1
```gherkin
Given twenty-five published listings
When a reader asks for the feed
Then the first twenty come back
And the count says twenty-five
And the page and its size are named in the answer
```

### 2. The feed shows only what has been published
Tier: 1
```gherkin
Given one published listing, one draft, one under review and one rejected
When a reader asks for the feed
Then only the published one is in it
And the count is one
```

### 3. A make narrows the feed, and a model narrows it further
Tier: 1
```gherkin
Given published listings of two makes, with two models of the first
When a reader asks for one make
Then every listing in the answer is of that make
And the count matches what came back
When the reader also asks for one model of that make
Then only listings of that model come back
```

### 4. A model asked for without a make is refused
Tier: 2
```gherkin
Given a catalogue holding a model
When a reader asks the feed for that model and names no make
Then the request is refused
And the refusal says the model needs a make
```

### 5. Ranges are inclusive at both ends
Tier: 2
```gherkin
Given published listings of 2010, 2015 and 2020
When a reader asks for listings from 2010 to 2015
Then both the 2010 one and the 2015 one come back
And the 2020 one does not
```

### 6. A range given backwards is refused rather than answered emptily
Tier: 2
```gherkin
Given published listings
When a reader asks for listings from 2020 down to 2010
Then the request is refused
And the refusal names the range that is backwards
```

### 7. Several gearboxes can be asked for at once
Tier: 2
```gherkin
Given published listings with three different gearboxes
When a reader asks for two of them in one request
Then only listings with those two come back
And the count matches what came back
```

### 8. Filters narrow together, not one at a time
Tier: 1
```gherkin
Given published listings of one make at several prices and years
When a reader asks for that make, a price ceiling and a year floor at once
Then every listing in the answer satisfies all three
And the count is the number that satisfy all three
```

### 9. The feed sorts by price in both directions and by newness by default
Tier: 1
```gherkin
Given published listings at different prices, published at different times
When a reader asks for the feed sorted by price ascending
Then the prices do not decrease down the page
When the reader asks for price descending
Then the prices do not increase down the page
When the reader asks with no sort at all
Then the most recently published listing is first
```

### 10. No listing appears on two pages, and none is skipped
Tier: 1
```gherkin
Given thirty published listings all carrying the same price
When a reader walks the feed page by page at ten a page sorted by price
Then thirty distinct listings come back
And none appears twice
```

### 11. A page past the end of the feed is empty, not an error
Tier: 2
```gherkin
Given three published listings
When a reader asks for the tenth page
Then the answer is accepted and holds nothing
And the count still says three
```

### 12. Filters that match nothing say so honestly
Tier: 2
```gherkin
Given published listings, none of them costing under one hundred thousand
When a reader asks for listings under one hundred thousand
Then nothing comes back
And the count is zero
```

### 13. A feed card carries what the card shows and nothing more
Tier: 2
```gherkin
Given a published listing with photographs, a description and a phone number
When a reader asks for the feed
Then the card carries the make, the model, the year, the price, the mileage,
  the gearbox and the cover photograph
And it carries neither the description nor the phone number
```

### 14. The listing card names its seller
Tier: 2
```gherkin
Given a published listing
When anyone opens it
Then the answer names the seller
And the seller's phone number is not in it
```

### 15. The phone number is given only when it is asked for
Tier: 1
```gherkin
Given a published listing whose seller left a phone number
When a signed-in reader opens the listing
Then no phone number is in the answer
When the reader asks for the phone number
Then it is given
```

### 16. Asking for a phone number requires signing in
Tier: 2
```gherkin
Given a published listing whose seller left a phone number
When a reader who has not signed in opens it
Then the listing comes back without a phone number
When that reader asks for the phone number
Then the request is refused as unauthenticated
```

### 17. The owner sees their own phone number without asking
Tier: 2
```gherkin
Given a listing whose seller left a phone number
When the seller opens their own listing
Then the phone number is in the answer
```

### 18. A phone number is not revealed for a listing nobody may see
Tier: 2
```gherkin
Given a draft listing carrying a phone number
When a signed-in stranger asks for its phone number
Then the request is reported as not found
```

### 19. The size of a page is bounded
Tier: 2
```gherkin
Given published listings
When a reader asks for a thousand of them on one page
Then the request is refused
And the refusal names the largest page allowed
```
