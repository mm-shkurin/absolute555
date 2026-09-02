# API Tests — Чат покупателя и продавца, непрочитанные

### 1. Making an offer opens the conversation
Tier: 1
```gherkin
Given a published listing
When a buyer offers a price for it
Then both the buyer and the seller have a dialogue about that listing
And it carries a line saying what was offered
```

### 2. A second offer joins the same conversation
Tier: 2
```gherkin
Given a buyer who withdrew an offer and made another on the same listing
When the buyer reads their dialogues
Then there is one dialogue about that listing
And both offers are lines in it
```

### 3. Either side writes and both see it
Tier: 1
```gherkin
Given a dialogue between a buyer and a seller
When the buyer writes a message
Then the seller reads it in the dialogue
When the seller answers
Then the buyer reads the answer after it
```

### 4. Messages arrive in the order they were written
Tier: 2
```gherkin
Given a dialogue with several messages written in turn
When either side reads the dialogue
Then the messages are in the order they were written
```

### 5. A dialogue belongs to its two participants and to nobody else
Tier: 1
```gherkin
Given a dialogue between a buyer and a seller
When a third signed-in person reads it or writes to it
Then both requests are reported as not found
```

### 6. A message written by the other side counts as unread
Tier: 2
```gherkin
Given a dialogue where the buyer has written two messages
When the seller reads their dialogues
Then that dialogue says two are unread
And the badge says two
```

### 7. Reading marks the messages that were named
Tier: 1
```gherkin
Given a dialogue with three unread messages from the buyer
When the seller marks two of them read
Then the dialogue says one is unread
And each marked message carries the moment it was read
```

### 8. Marking your own message read changes nothing
Tier: 2
```gherkin
Given a dialogue where the seller has written a message
When the seller marks that message read
Then nothing is marked
And the buyer still has it unread
```

### 9. Marking the same message twice does not move when it was read
Tier: 2
```gherkin
Given a message the seller has already marked read
When the seller marks it read again
Then the moment it was read is unchanged
```

### 10. The badge counts every dialogue at once
Tier: 2
```gherkin
Given a seller with unread messages in two dialogues
When the seller reads the badge
Then it is the two dialogues' unread counts added together
```

### 11. Accepting an offer says so in the conversation
Tier: 2
```gherkin
Given a dialogue opened by an offer
When the seller accepts that offer
Then the dialogue carries a line saying the offer was accepted
And that line has no human author
```

### 12. A buyer whose car was sold to somebody else is told in the conversation
Tier: 2
```gherkin
Given two buyers with offers on one listing
When the seller accepts one of the offers
Then the other buyer's dialogue carries a line saying the car was sold
```

### 13. A client cannot write a system line
Tier: 2
```gherkin
Given a dialogue between a buyer and a seller
When the buyer sends a message asking for it to be a system line
Then the request is refused
And nothing is added to the dialogue
```

### 14. An empty message is refused
Tier: 2
```gherkin
Given a dialogue between a buyer and a seller
When either side sends a message of blank space
Then the request is refused
And nothing is added to the dialogue
```

### 15. A sold listing leaves the conversation open
Tier: 2
```gherkin
Given a dialogue about a listing that has been sold
When either side writes a message
Then it is delivered
```

### 16. A dialogue names the listing and the other person
Tier: 2
```gherkin
Given a dialogue between a buyer and a seller
When the seller reads their dialogues
Then the dialogue names the listing it is about
And it names the buyer, not the seller themselves
```

### 17. The dialogue list is ordered by the last thing said
Tier: 2
```gherkin
Given a seller with two dialogues
When somebody writes in the older one
Then it is first in the seller's list
```
