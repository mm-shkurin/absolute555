# UI Tests — Объявление: черновик и жизненный цикл статусов

### 1. My listings are grouped by status
Tier: 2 (hz-08)
```gherkin
Given a seller with one draft, one listing under review, two published listings,
  one rejected listing and one sold listing
When the seller opens "My listings"
Then a basket is shown for each of drafts, under review, published, rejected and sold
And each basket names how many listings it holds
When the seller opens the drafts basket
Then only the draft listing is shown
```

### 2. Цена и пробег принимаются в том виде, в каком их пишут
Добавлен по аудиту покрытия. Исполняемая копия:
`frontend/src/features/selling/logic/__tests__/humanNumbers.test.ts`.
```gherkin
Scenario Outline: Цена сохраняется, введённая как в подсказке
  Given продавец на шаге цены
  When вводит цену "<ввод>"
  Then на сервер уходит <число>
  Examples:
    | ввод           | число   |
    | 4 020 000      | 4020000 |
    | 4020000        | 4020000 |
    | 4 020 000 (nbsp) | 4020000 |

Scenario: Пробег «180 000» и цена под ключ «6 690 000» не теряются
  When продавец привоза вводит пробег и цену под ключ с пробелами
  Then на сервер уходят 180000 и 6690000

Scenario: Сводка перед отправкой показывает цену, введённую с пробелами
  Given продавец ввёл цену «4 020 000»
  When открывает шаг отправки
  Then в сводке сумма, а не «NaN»
```

