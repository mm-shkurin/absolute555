# Load Tests (Tier 3) — Лента и карточка объявления

Записаны и не строятся. Обе меряют форму запроса, а не поведение: утверждение
«отвечает за то же время» на тысяче строк в контейнере разработчика зелёное при любой
реализации, а на проде красное от соседа по диску. Форму держит проверка индексов
(`04_Infrastructure_Tests.md`), и она детерминирована.

### 1. The feed answers in the same time whether it is the first page or the last
Tier: 3
```gherkin
Given a thousand published listings
When a reader asks for the first page and then for the last
Then both answers come back within the same order of time
```

### 2. Filtering does not read the whole table
Tier: 3
```gherkin
Given a thousand published listings across many makes
When a reader filters by make, year and price at once
Then the query is answered from indexes rather than by scanning every row
```
