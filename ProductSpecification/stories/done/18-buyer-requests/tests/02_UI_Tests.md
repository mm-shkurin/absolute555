# UI Tests — Заявки покупателя

Исполняемая копия: `frontend/src/features/importRequest/logic/__tests__/requestDraft.test.ts`.

```gherkin
Feature: Заявка на привоз

  Scenario: Бюджет, введённый как в подсказке, уходит в заявку
    Given покупатель заполняет заявку
    When вписывает бюджет «12 000 000»
    Then в заявке бюджет 12000000
```
