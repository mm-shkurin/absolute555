# Security Tests — Чат

### 1. A stranger cannot read or write in a dialogue
Tier: 1 (sec:IDOR)
```gherkin
Given a dialogue between a buyer and a seller
When a third signed-in person reads its messages, writes to it or marks it read
Then every request is reported as not found
And the dialogue is unchanged
```

### 2. Every chat route refuses a caller who has not signed in
Tier: 1 (sec:JWT)
```gherkin
Given a dialogue between a buyer and a seller
When an unauthenticated caller reads dialogues, messages, the badge or writes
Then every request is refused as unauthenticated
```

### 3. A live connection without a token is closed
Tier: 1 (sec:JWT)
```gherkin
Given the live chat channel
When a client connects with no token or a forged one
Then the connection is closed instead of left open
```

### 4. A live connection carries only its own dialogues
Tier: 1 (sec:IDOR)
```gherkin
Given two dialogues belonging to different pairs
And a person connected to the live channel who is in only one of them
When a message is written in the other dialogue
Then nothing about it reaches that connection
```

### 5. The recognition stream stops being open to whoever knows an identifier
Tier: 1 (sec:IDOR)
```gherkin
Given a listing whose registration scan is being read
When a signed-in stranger opens the stream of that listing
Then the request is reported as not found
When the owner opens it
Then the stream is theirs to read
```

### 6. The phone number never leaks through a dialogue
Tier: 2 (sec:DataExposure)
```gherkin
Given a dialogue about a listing whose seller left a phone number
When the buyer reads the dialogue and its listing
Then no phone number is in either answer
```
