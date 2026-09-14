# Абсолют — фронтенд

Маркетплейс подержанных автомобилей: лента, карточка с картой окрасов кузова, мастер
продажи с распознаванием СТС, офферы, чаты, импорт под заказ и консоль модерации.

React 18 + TypeScript + Vite, данные с сервера — TanStack Query, мобильная сборка —
Capacitor. Подробная архитектура: [`ProductSpecification/frontend-architecture.md`](../ProductSpecification/frontend-architecture.md),
дизайн-система: [`ProductSpecification/ui/ui-conventions.md`](../ProductSpecification/ui/ui-conventions.md).

## Быстрый старт (дев-сервер)

Нужен Node.js ≥ 20.19.

```bash
cp .env.example .env      # впишите порт бэкенда в VITE_API_PROXY_TARGET
npm install
npm run dev               # http://localhost:5173, /api проксируется на бэкенд
```

Без бэкенда: `npm run dev:mock` — ответы сервера отдаёт `src/dev/mockServer.ts`, сессия
администратора создаётся сама, `?guest=1` переключает на гостя.

## Запуск в контейнере (Docker Compose)

Стандартный воспроизводимый способ — весь стек из `infra/`: nginx отдаёт собранный SPA и
проксирует `/api/` на бэкенд.

```bash
cp ../infra/.env.example ../infra/.env
docker compose -f ../infra/docker-compose.yml --env-file ../infra/.env up -d --build frontend
```

Образ собирается по `infra/docker/frontend.Dockerfile` (стадия `npm ci && npm run build`,
затем nginx с `infra/docker/nginx/frontend.conf`). Сервис `frontend` зависит от `backend`,
поэтому compose поднимает и его. Приложение: `http://localhost:${FRONTEND_HOST_PORT}`
(в шаблоне — 3000).

## Архитектура: Feature-Sliced Design

```
app       собирает приложение: роутинг, провайдеры — видит всё
features  вертикальные срезы продукта; фича не знает о соседней фиче
shared    транспорт, сессия, кэш запросов, UI-кит, токены — не видит никого
dev       мок-сервер для `dev:mock`; в обычную сборку не попадает
```

Импорт идёт только внутрь. Правило проверяется, а не описано: `npm run lint` запускает
`scripts/check-boundaries.mjs`.

### Срезы

| Срез                                          | Экраны                                                          |
| --------------------------------------------- | --------------------------------------------------------------- |
| `landing`                                     | лендинг и «Как это работает»                                    |
| `auth`                                        | возврат из Яндекс ID, экран закрытого доступа                   |
| `feed`, `importFeed`                          | лента объявлений, выдача машин под привоз                       |
| `listing`, `sellerProfile`, `supplier`        | карточка объявления, профиль продавца, витрина поставщика       |
| `thickness`                                   | карта окрасов: просмотр покупателем, ввод замеров продавцом     |
| `selling`                                     | мастер продажи: СТС, характеристики, фото, отправка на проверку |
| `myListings`, `offers`, `chats`               | мои объявления, офферы, переписки                               |
| `profile`, `supplierProfile`, `importRequest` | профиль, заявка и витрина поставщика, заявки на привоз          |
| `moderation`                                  | сводка, очередь, жалобы, заявки на роль, люди                   |

Раскладка внутри среза: страница `*Page.tsx` и хуки `use*.ts` в корне среза, `api/` —
перевод wire ⇄ приложение, если он есть, `components/` — разметка, `logic/` — чистые функции
без React, `__tests__/` рядом с тем, что они проверяют.

### Слои HTTP

```
shared/api/httpClient             транспорт; про авторизацию не знает ничего
shared/session/authorizedRequest  токен, обновление сессии, повтор запроса
shared/api/send                   httpClient + сессия + читаемый текст ошибки
shared/api/backend/*              контракты сервера и пути (`paths.ts` — единственная карта URL)
features/*/api/*Api               перевод wire ⇄ модель экрана
```

Срез заводит `api/` только там, где переводит wire ⇄ модель экрана. Где перевода нет, хуки и
компоненты импортируют `shared/api/backend/*Api` и `*Contract` напрямую: реэкспорт или
функция-прокладка дают тому же запросу второе имя и ничего не проверяют.

Доступ к `window`, `document` и хранилищам — только через `shared/lib/browser.ts`.

## Решения и почему

- **Сессия — не фича.** Токены и роль живут в `shared/session`: роль читает почти каждый
  экран, и срез `auth` импортировался бы отовсюду.
- **Состояние сервера — TanStack Query, своего стора нет.** Всё общее состояние — ответы
  сервера; локальное состояние форм остаётся в компонентах.
- **У `VITE_API_PROXY_TARGET` нет дефолта.** Порт свой у каждой копии репозитория, и
  молчаливый дефолт давал бы приложение, шлющее запросы в чужой процесс.
- **Шрифты не с `fonts.googleapis.com`.** Сторонний CDN на критическом пути рендера в этом
  рынке регулярно блокируется; файлы кладутся в `public/fonts/`.
- **Распознавание ждёт поток SSE**, а перечитывание объявления — страховка с нарастающей
  паузой (`useStsRecognition.ts`).
- Решения по историям — `ProductSpecification/stories/**/decisions/`.

## Команды

| Команда                                    | Что делает                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| `npm run dev` / `npm run dev:mock`         | дев-сервер с прокси на бэкенд / на мок-сервер                                    |
| `npm run build` / `npm run build:mock`     | typecheck и сборка в `dist/`                                                     |
| `npm run preview` / `npm run preview:mock` | отдать собранный `dist/`                                                         |
| `npm run typecheck`                        | только проверка типов                                                            |
| `npm run lint`                             | oxlint, гейт границ импорта и его самопроверка, сверка мок-сервера с контрактами |
| `npm run format` / `npm run format:check`  | Prettier: исправить / проверить                                                  |
| `npm test` / `npm run test:coverage`       | Vitest (jsdom) / с покрытием в `coverage/`                                       |
| `npm run test:e2e`                         | браузерные сценарии Selenium против `dev:mock`                                   |
| `npm run test:e2e:live`                    | те же сценарии против поднятого стека (`E2E_BASE_URL`)                           |

Браузерным сценариям нужен установленный Chrome; драйвер Selenium Manager скачивает сам.
`E2E_HEADED=1` показывает окно браузера.

## Тесты

- Модульные и компонентные — `src/**/__tests__/`, Vitest + Testing Library.
- Браузерные — `e2e/specs/*.e2e.ts`, Selenium.
- Ручные тест-кейсы по экранам — [`docs/testing/`](docs/testing/README.md).
- CI (`.github/workflows/frontend.yml`) на каждый push в `frontend/**`: typecheck, lint,
  тесты с покрытием, сборка, образ и браузерные сценарии.

## Свои скрипты вместо стандартных правил

- `scripts/check-boundaries.mjs` — направление импорта FSD. Стандартные
  `import/no-restricted-paths` и `eslint-plugin-boundaries` требуют ESLint, а линтер здесь
  oxlint, где этих правил нет. У гейта есть самопроверка (`check-boundaries.selftest.mjs`).
- `scripts/check-mock-parity.mjs` — мок-сервер отвечает теми же путями и формами, что
  контракты `shared/api/backend`. Без сверки мок разошёлся с сервером, и браузерные
  сценарии зеленели против того, чего нет.

## Ветки и коммиты

Работа идёт в ветке `features/<история>` от `dev`, слияние в `dev`, релиз — `dev` → `main`.
Коммиты — Conventional Commits, объяснение «почему» — в теле коммита. Правила:
[`.claude/rules/git.md`](../.claude/rules/git.md). История изменений — [`CHANGELOG.md`](CHANGELOG.md).

## Android

Capacitor берёт готовый `dist/`. Папка платформы генерируется и не хранится в репозитории:

```bash
npm run build
npx cap add android       # один раз на свежей копии
npx cap sync android
```

## Что ещё не сделано

- **Файлов шрифтов нет.** `src/styles/fonts.css` ссылается на `public/fonts/*.woff2`;
  пока их нет, страница рисуется системным шрифтом, сборка не падает.
