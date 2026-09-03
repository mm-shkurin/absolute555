# Security Tests — Админка: люди, роли, блокировки, сводка

### 1. An ordinary user finds no admin routes
Tier: 1 (sec:AuthZ)
```gherkin
Given a signed-in ordinary user
When they ask for the list of people, a person's card, the journal,
     or try to block someone
Then every attempt is refused
And nothing about any account changes
```

### 2. A moderator sees people but does not touch roles
Tier: 2 (sec:AuthZ)
```gherkin
Given a signed-in moderator
When they read the list of people and open a card
Then both answer
But changing a role and reading the journal are refused
```

### 3. A moderator does not close the door on their own level
Tier: 1 (sec:PrivEsc)
```gherkin
Given a moderator, another moderator and an administrator
When the first moderator blocks either of them with a reason
Then the attempt is refused
And the target keeps their access
```

### 5. A blocked administrator loses their own console
Tier: 2 (sec:AuthZ)
```gherkin
Given an administrator blocked by another administrator
When they use the token they still hold
Then every request is refused, the admin routes included
```
