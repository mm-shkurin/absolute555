# Security Tests — Роли и заявки: manager, importer

### 1. A guest asks for nothing
Tier: 1
```gherkin
Given a guest session
When it asks for the importer role
Then the request is refused
```

### 2. An ordinary user does not read the queue or decide
Tier: 1
```gherkin
Given a signed-in user who is not a moderator
When they read the request queue or decide a request
Then both are refused
```

### 3. A moderator cannot promote themselves through a request
Tier: 1
```gherkin
Given a moderator who has asked for the admin role themselves
When they approve their own request
Then the attempt is refused
And they still hold the manager role
```

### 4. Role routes refuse a caller who has not signed in
Tier: 2
```gherkin
Given no credentials
When a request is created, listed or decided
Then every call is refused as unauthorised
```

### 5. Only an administrator sets a role directly
Tier: 2
```gherkin
Given a moderator
When they set somebody's role to admin directly
Then the attempt is refused
```
