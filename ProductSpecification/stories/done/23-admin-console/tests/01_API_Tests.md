# API Tests — Админка: люди, роли, блокировки, сводка

### 1. Blocking a person closes the door and says why
Tier: 1
```gherkin
Given a signed-in seller and an administrator
When the administrator blocks the seller with a reason
Then the seller reads as blocked and carries that reason
And a token the seller already held no longer opens anything
And the refusal names the block rather than a broken sign-in
```

### 2. Unblocking gives the door back
Tier: 1
```gherkin
Given a blocked seller
When an administrator unblocks them with a reason
Then the seller reads as no longer blocked
And they sign in and act as before
```

### 3. A block without a reason is refused
Tier: 2
```gherkin
Given a signed-in seller and an administrator
When the administrator blocks them without a reason
Then the attempt is refused as invalid
And the seller still has their access
```

### 4. Nobody blocks themselves
Tier: 2
```gherkin
Given an administrator
When they block their own account with a reason
Then the attempt is reported as a conflict
And they still have their access
```

### 5. A block is not applied twice
Tier: 2
```gherkin
Given a seller an administrator has already blocked
When the administrator blocks them again with a reason
Then the attempt is reported as a conflict
And the journal holds one block, not two
```

### 6. Unblocking someone who was never blocked
Tier: 2
```gherkin
Given a seller with their access intact
When an administrator unblocks them with a reason
Then the attempt is reported as a conflict
```

### 7. The listings of a blocked seller leave the feed and come back
Tier: 1
```gherkin
Given a seller with a published listing visible in the feed
When an administrator blocks the seller with a reason
Then the feed no longer offers that listing
And when the administrator unblocks them the listing is offered again
```

### 8. The journal records who did what and why
Tier: 1
```gherkin
Given an administrator who blocked a seller with a reason
When the administrator reads the journal of that account
Then it names the block, the reason, and the administrator who did it
And the newest record comes first
```

### 9. Changing a role is recorded with its reason
Tier: 1
```gherkin
Given a signed-in user and an administrator
When the administrator makes them a manager with a reason
Then the person holds the manager role
And the journal names the change, the reason, and both roles
```

### 10. The list of people arrives a page at a time
Tier: 1
```gherkin
Given more registered people than fit one page
When an administrator asks for the first page of people
Then only one page of them comes back
And the answer says how many there are in total
```

### 11. The list narrows by name, by role and by access
Tier: 2
```gherkin
Given people with different names, roles and blocks
When an administrator searches by part of a name
Then only the matching people come back
And asking for one role, or for the blocked only, narrows it the same way
```

### 12. A person's card carries what a moderator needs to judge
Tier: 2
```gherkin
Given a seller with listings and complaints against them
When a moderator opens that person's card
Then the card names their role, whether they are blocked,
     how many listings they have and how many complaints they drew
```
