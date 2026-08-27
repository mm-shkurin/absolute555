# Абсолют — фронтенд

React + TypeScript + Vite. Архитектура и её обоснование:
[`ProductSpecification/frontend-architecture.md`](../ProductSpecification/frontend-architecture.md).
Дизайн-система: [`ProductSpecification/ui/ui-conventions.md`](../ProductSpecification/ui/ui-conventions.md).

## Быстрый старт

```bash
cp .env.example .env      # впишите адрес бэкенда в VITE_API_PROXY_TARGET
npm install
npm run dev
```

Дев-сервер проксирует `/api` на бэкенд. Дефолта у адреса нет намеренно: порт свой у каждой
копии репозитория, и молчаливый дефолт означал бы приложение, которое поднялось и шлёт
запросы в чужой процесс. Порт бэкенда: `grep BACKEND_PORT ../infra/.env`.

## Архитектура: Feature-Sliced Design

```
app       собирает приложение: роутинг, провайдеры — видит всё
features  вертикальные срезы продукта; фича не знает о соседней фиче
shared    транспорт, сессия, кэш, токены, конфиг — не видит никого
```

Импорт идёт только внутрь, **без исключений**. Правило не описано, а проверено:
`npm run lint` заканчивается `scripts/check-boundaries.mjs`.

Внутри среза раскладка одинаковая: `api/` `components/` `hooks/` `utils/` `__tests__/`.

### Слои HTTP

```
shared/api/httpClient             транспорт; про авторизацию не знает ничего
shared/session/authorizedRequest  токен, обновление сессии, повтор запроса
shared/api/send                   httpClient + сессия + читаемый текст ошибки
features/*/api/*Api               конкретные эндпоинты, перевод wire ⇄ приложение
```

`shared/api/endpoints.ts` — единственное место, знающее URL-пространство сервера.

### Сессия — не фича

Токены и роль вошедшего живут в `shared/session`, в `features/auth` останутся только экраны
входа. Ролей пять (`guest`, `user`, `importer`, `manager`, `admin`), и роль читает почти
каждый экран: лента прячет действия у гостя, карточка меняет блок кнопок, модерация
существует только для двух ролей.

## Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | дев-сервер с прокси на бэкенд |
| `npm run build` | typecheck и сборка в `dist/` |
| `npm run typecheck` | только проверка типов |
| `npm run lint` | oxlint + самопроверка гейта границ + сам гейт |
| `npm test` | Vitest |
| `npm run format` | Prettier |

## Что ещё не сделано

- **Шрифтов нет в репозитории.** `src/styles/fonts.css` ссылается на четыре файла в
  `public/fonts/`, которых пока нет — сборка предупреждает об этом и не падает, а страница
  рисуется системным шрифтом. Взять Golos Text и JetBrains Mono с fonts.google.com,
  положить файлами. Ссылку на `fonts.googleapis.com` не возвращать: сторонний CDN на
  критическом пути рендера, в этом рынке регулярно блокируется.
- **Экранов нет.** Каркас поднят до них намеренно, чтобы первая фича легла в готовые
  границы. Разметка всех 26 экранов — в `ProductSpecification/ui/mockups/index.html`,
  карта «экран → срез» — в `frontend-architecture.md`.
- **Старый фронт лежит в `legacy-cra/`.** Это CRA-приложение под предыдущий Django-бэкенд
  (история 12). К нынешнему API не подходит и не собирается вместе с новым — из линтера и
  сборки исключён. Удалить, когда перенос экранов закончится.

## Android

Capacitor берёт готовый `dist/`:

```bash
npm run build
npx cap sync android
```
