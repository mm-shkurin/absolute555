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

### 3. Черновик и фотографии мастера на сервере
Добавлен циклом покрытия (итерация 1). Исполняемые копии:
`frontend/src/features/selling/__tests__/useDraftSync.test.ts`, `useGallery.test.ts`,
`useStsRecognition.test.ts`.
```gherkin
Scenario: Ушёл и вернулся — открывается начатый черновик, а не новый
  Given продавец начал черновик Lexus GS с ценой 1 900 000 ₽ и ушёл из мастера
  When возвращается по ссылке «Продолжить»
  Then мастер показывает введённое, и второй черновик не заводится

Scenario: Новый черновик заводится один раз и запоминается в адресе
  When продавец открывает мастер
  Then на сервере один черновик, и адрес мастера называет его

Scenario: Цена, введённая на шаге, сохраняется на сервере числом
  When продавец вводит цену «4 020 000» и идёт дальше
  Then на сервере цена 4020000

Scenario: VIN, вписанный руками, уходит на распознавание
  Given снимок прочитан, а VIN в нём — нет
  When продавец вписывает VIN
  Then сервер получает VIN полем запроса

Scenario: Снимок СТС не принят — мастер остаётся на шаге документа
  When сервер отвергает снимок как слишком большой
  Then мастер не переходит к распознаванию

Scenario: Добавленные фото показываются так, как их сохранил сервер
  When продавец добавляет два снимка
  Then в галерее два фото из ответа сервера

Scenario: Шестнадцатое фото — отказ текстом, а не молчание
  When продавец добавляет фото сверх лимита
  Then видит «Больше фотографий добавить нельзя.»

Scenario: Продавец меняет порядок — сервер получает новый порядок
Scenario: Удалённое фото пропадает из галереи
Scenario: Вернулся к черновику — галерея перечитывается с сервера

Scenario: Снимок прочитан — мастер узнаёт исход из потока
Scenario: Поток не застали — исход берётся из объявления
```

