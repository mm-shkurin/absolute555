# Infrastructure Tests — Гигиена слоёв

### 1. No router reaches into the ORM
Tier: 1
```gherkin
Given the repository rules gate and its baseline
When the gate is run over the backend
Then it reports no violations
And the baseline of known violations is empty
```

### 2. The suite still passes unchanged
Tier: 1
```gherkin
Given a change that moves no behaviour
When the whole backend suite is run
Then every test that passed before passes now
```
