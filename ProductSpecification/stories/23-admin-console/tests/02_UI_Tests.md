# UI Tests — Админка: люди, роли, блокировки, сводка

### 1. The moderator finds the way in from the header
Tier: 1
```gherkin
Given a signed-in moderator on the feed
When they look at the header
Then a way into moderation is there
And following it opens the queue
```

### 2. An ordinary person is not told the console exists
Tier: 2
```gherkin
Given a signed-in ordinary user on the feed
When they look at the header
Then no way into moderation is offered
And typing the address opens "not found" rather than "no rights"
```

### 3. The summary says where the work has piled up
Tier: 1
```gherkin
Given a queue, complaints and role applications all waiting
When an administrator opens the console
Then the summary names how many of each are waiting
And each number leads to the section it counts
```

### 4. The people screen searches and pages
Tier: 2
```gherkin
Given more people than fit one page
When an administrator opens the people screen
Then one page of them is shown with a way to the next
And searching by name narrows the list
```

### 5. Blocking asks for a reason before it acts
Tier: 2
```gherkin
Given an administrator on a person's card
When they choose to block and confirm without writing a reason
Then the block does not happen and the screen asks for one
And after a reason is written the card reads as blocked
```

### 6. The card shows the journal to an administrator only
Tier: 2
```gherkin
Given a person whose role was changed and who was blocked
When an administrator opens their card
Then the journal lists both, newest first, each with its reason
But a moderator opening the same card is not shown the journal
```

### 7. The blocked person is told plainly
Tier: 2
```gherkin
Given a person whose access was closed
When they come back and sign in
Then the screen says the access is closed and where to write
And it does not read as a sign-in failure
```
