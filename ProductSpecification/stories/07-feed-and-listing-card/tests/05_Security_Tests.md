# Security Tests — Лента и карточка объявления

### 1. The feed never carries a phone number
Tier: 1 (sec:DataExposure)
```gherkin
Given twenty published listings, each with a phone number
When anyone reads the feed, filtered and unfiltered, on every page
Then no phone number is in any answer
```

### 2. An unpublished listing cannot be found through the feed
Tier: 1 (sec:IDOR)
```gherkin
Given a draft listing and a rejected one, both of a known make
When a signed-in stranger filters the feed by that make
Then neither is in the answer
And the count does not include them
```

### 3. Revealing a phone number is not a way to enumerate listings
Tier: 2 (sec:IDOR)
```gherkin
Given a listing identifier that belongs to no listing
And a draft listing belonging to someone else
When a signed-in reader asks each of them for a phone number
Then both are reported as not found, indistinguishably
```

### 4. A filter value is data, not a query
Tier: 2 (sec:SQLi)
```gherkin
Given published listings
When a reader sends a gearbox value carrying a quotation mark and a semicolon
Then the request is answered or refused
And the listings are all still there
```
