# UI Tests — Объявление: черновик и жизненный цикл статусов — Tier 3

Recorded, never built.

### 2. The wizard shows that a draft was saved
Tier: 3 (hz-08)
```gherkin
Given a seller filling in the placement wizard
When the seller completes a step
Then the wizard shows that the draft was saved
And leaving and reopening the wizard returns to the same step with the same values
```

### 3. A rejected listing shows the moderator's reason
Tier: 3 (hz-08)
```gherkin
Given a seller with a listing rejected for a stated reason
When the seller opens "My listings"
Then the rejected listing shows the moderator's reason
And it offers to correct and send the listing again
```

### 4. An incomplete draft points at the steps that are missing
Tier: 3 (hz-08)
```gherkin
Given a seller in the wizard with a draft missing a phone number and a photo
When the seller sends the draft for review
Then the wizard marks the contact step and the photo step as incomplete
And the draft is not sent
```
