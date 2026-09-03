# API Tests — Роли и заявки: manager, importer

### 1. A user asks to become an importer
Tier: 1
```gherkin
Given a signed-in user with no importer role
When they ask for the importer role with a reason
Then the request is waiting for a decision
And it appears among their own requests
```

### 2. Approving a request grants the role
Tier: 1
```gherkin
Given a waiting request for the importer role
When a moderator approves it
Then the request reads approved
And the person who asked now holds the importer role
```

### 3. A rejection carries a comment and grants nothing
Tier: 1
```gherkin
Given a waiting request for the importer role
When a moderator rejects it with a comment
Then the request reads rejected and carries the comment
And the person who asked still holds their old role
```

### 4. A rejection without a comment is refused
Tier: 2
```gherkin
Given a waiting request
When a moderator rejects it without a comment
Then the attempt is refused as invalid
And the request is still waiting
```

### 5. A decided request is not decided again
Tier: 1
```gherkin
Given a request a moderator has already rejected
When the same moderator approves it
Then the attempt is reported as a conflict
And the person who asked still holds their old role
```

### 6. A moderator does not hand out their own level
Tier: 1
```gherkin
Given a waiting request for the admin role
When a moderator approves it
Then the attempt is refused
And the person who asked still holds their old role
```

### 7. An administrator may hand out any role
Tier: 2
```gherkin
Given a waiting request for the manager role
When an administrator approves it
Then the person who asked holds the manager role
```

### 8. One live request per role
Tier: 1
```gherkin
Given a user whose request for the importer role is waiting
When they ask for the importer role again
Then the attempt is reported as a conflict
```

### 9. A refusal is not the end of the road
Tier: 2
```gherkin
Given a user whose request for the importer role was rejected
When they ask for the importer role again
Then the new request is waiting for a decision
```

### 10. Asking for a role one already holds
Tier: 2
```gherkin
Given a user who already holds the importer role
When they ask for the importer role
Then the attempt is reported as a conflict
```

### 11. The moderator sees the queue with names
Tier: 2
```gherkin
Given two waiting requests from different people
When a moderator reads the waiting requests
Then both are listed, each naming who asked
```

### 12. The queue narrows by status
Tier: 2
```gherkin
Given one waiting request and one already approved
When a moderator reads the approved ones
Then only the approved request is listed
```

### 13. An importer keeps what a user could do
Tier: 1
```gherkin
Given a person who has just been granted the importer role
When they publish a listing and make an offer on somebody else's
Then both are allowed
```

### 14. Taking the role away leaves the listings alone
Tier: 2
```gherkin
Given an importer with a published listing
When an administrator sets their role back to user
Then the listing is still published
And its seller still reads as its author
```

### 15. A request for nobody is not found
Tier: 2
```gherkin
Given an identifier belonging to no request
When a moderator decides it
Then the request is reported as not found
```
