# UI Tests — Фото объявления: загрузка, порядок, обложка — Tier 3

Recorded, never built.

### 1. The seller drags a photograph into place and sees it move
Tier: 3 (hz-08)
```gherkin
Given a seller on the photographs step with four photographs
When the seller drags the third one to the front
Then it appears first straight away, without waiting for the server
And it is marked as the cover
```

### 2. The counter tracks the gallery and the limit stops it
Tier: 3 (hz-08)
```gherkin
Given a seller on the photographs step with seven photographs
Then the step says seven of fifteen
When the seller adds eight more
Then the step says fifteen of fifteen
And adding another is not offered
```

### 3. A refused photograph says why
Tier: 3 (hz-08)
```gherkin
Given a seller on the photographs step
When the seller adds a file that is not an image
Then the step says that file was not added and why
And the photographs already added are still there
```
