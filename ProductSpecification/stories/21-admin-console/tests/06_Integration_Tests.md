# Integration Tests — Админка: люди, роли, блокировки, сводка

### 1. From complaint to closed door
Tier: 2
```gherkin
Given a complaint against a published listing
When a moderator unpublishes the listing and blocks its author with a reason
Then the listing is gone from the feed
And the author cannot sign in again
And the journal names who closed the door and why
```
