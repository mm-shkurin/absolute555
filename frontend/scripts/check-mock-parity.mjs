// Гейт паритета заглушки. Идёт хвостом `npm run lint`.
//
// Ловит поломку, которая один раз уже случилась молча: экраны переехали на настоящие
// адреса сервера, а `src/dev/mockServer.ts` остался отвечать на выдуманные. Юнит-тесты
// при этом были зелёными — они не видят экрана, — и обнаружилось это только браузерным
// прогоном, где семнадцать сценариев из двадцати одного упали разом.
//
// Правило простое: каждый путь, объявленный в `shared/api/backend/paths.ts`, должен
// обслуживаться заглушкой либо стоять в списке заведомо не покрытых.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../src')

const paths = readFileSync(resolve(root, 'shared/api/backend/paths.ts'), 'utf8')
// В заглушке пути живут и строками, и регулярками, где косая черта экранирована.
// Сравнение идёт по нормализованному тексту, иначе `\/sale_car\/` не совпадёт с `/sale_car/`.
//
// Читаются оба файла заглушки: чтение живёт в `mockServer.ts`, запись — в
// `mutationRoutes.ts`, и гейт, знающий только про первый, объявил бы каждую мутацию
// необслуженной.
const mock = ['dev/mockServer.ts', 'dev/mutationRoutes.ts']
  .map((file) => readFileSync(resolve(root, file), 'utf8'))
  .join('\n')
  .replaceAll(String.raw`\/`, '/')

// Заглушке незачем изображать то, что не запрос: OAuth уводит страницу на сервер,
// WebSocket и поток событий поднимают соединение, а не отвечают телом.
const NOT_A_REQUEST = [
  'auth.yandexStart',
  'auth.oauthStart',
  'chat.socket',
  'stream.listing',
  'saleCar.sts',
]

// Пути, которые заглушка намеренно не обслуживает: экран за ними ещё не переведён на
// настоящий адрес, либо мутация в моке отвечает общим успехом.
const UNMOCKED = [
  // Обмен кода на сессию заглушка не изображает: без неё в моке нет и провайдера, а
  // экраны мока и так открываются с готовой сессией.
  'auth.oauthExchange',
  'auth.refresh',
  'auth.guestLogin',
  'saleCar.draft',
  'saleCar.photos',
  'saleCar.photo',
  'saleCar.photoOrder',
  'saleCar.submit',
  'saleCar.withdraw',
  'saleCar.sold',
  'saleCar.republish',
  'saleCar.revise',
  'saleCar.approve',
  'saleCar.reject',
  'saleCar.revealPhone',
  // Мутации отвечают из `dev/fixtures/mutations.ts`, куда гейт не смотрит: он сверяет
  // только выдачи, объявленные в `mockServer.ts`.
  'review.ofOffer',
  'review.one',
  'offer.collection',
  'offer.one',
  'offer.status',
  'offer.withdraw',
  'chat.read',
  'chat.messages',
  'moderation.dismissComplaint',
  'moderation.unpublish',
  'moderation.complain',
  'role.users',
  'role.userRole',
  'role.roleInfo',
  'role.stats',
  'role.request',
  'role.answerRequest',
]

// Строки вида `  key: \`${V1}/path\`,` и `  key: (id: string) => \`${V1}/path/${...}\``.
const ENTRY = /^\s{4}(\w+):\s*(?:\([^)]*\)\s*=>\s*)?`\$\{V1\}([^`]*)`/gm
const GROUP = /^\s{2}(\w+):\s*\{/gm

function declaredPaths(source) {
  const groups = []
  for (const match of source.matchAll(GROUP)) groups.push({ name: match[1], at: match.index })

  const found = []
  for (const match of source.matchAll(ENTRY)) {
    const group = groups.findLast((candidate) => candidate.at < match.index)
    // Шаблонные сегменты в пути заменяются на плейсхолдер: сравнивается форма, а не
    // конкретный идентификатор.
    const shape = match[2].replaceAll(/\$\{[^}]*\}/g, ':id')
    found.push({ key: `${group?.name ?? '?'}.${match[1]}`, path: shape })
  }
  return found
}

const skipped = new Set([...NOT_A_REQUEST, ...UNMOCKED])
const problems = []

for (const entry of declaredPaths(paths)) {
  if (skipped.has(entry.key)) continue
  // Заглушка сверяет путь без версии: `route` срезает `/api/v1` до сравнения.
  const literal = `'${entry.path}'`
  const asRegex = entry.path.replaceAll(':id', '([^/]+)')
  if (mock.includes(literal) || mock.includes(asRegex)) continue
  problems.push(`${entry.key} → ${entry.path}`)
}

if (problems.length > 0) {
  console.error('Заглушка не отвечает на пути, которые запрашивают экраны:')
  for (const problem of problems) console.error(`  ${problem}`)
  console.error(
    '\nЛибо добавьте маршрут в src/dev/mockServer.ts, либо внесите ключ в UNMOCKED\n' +
      'в scripts/check-mock-parity.mjs с объяснением, почему заглушке он не нужен.',
  )
  process.exit(1)
}

console.log(`Заглушка отвечает на все запрашиваемые пути — проверено ${skipped.size} исключений.`)
