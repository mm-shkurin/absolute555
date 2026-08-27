// Самопроверка гейта границ: гейт, который никогда не падает, ничего не проверяет.
//
// Собирает во временном каталоге заведомо нарушающее дерево, запускает на нём гейт и
// требует ненулевого кода возврата. Потом собирает заведомо чистое и требует нулевого.
// Без первой половины гейт со сломанным регулярным выражением молча пропускает всё.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const gate = resolve(here, 'check-boundaries.mjs')

function build(files) {
  const root = mkdtempSync(join(tmpdir(), 'absolute-boundaries-'))
  for (const [path, body] of Object.entries(files)) {
    const full = join(root, path)
    mkdirSync(dirname(full), { recursive: true })
    writeFileSync(full, body, 'utf8')
  }
  return root
}

function run(root) {
  return spawnSync(process.execPath, [gate, `--src=${root}`], { encoding: 'utf8' })
}

const cases = [
  {
    name: 'фича, импортирующая соседнюю фичу, красит гейт',
    files: {
      'features/catalog/components/Card.tsx': "import { x } from '../../listing/utils/price'\n",
      'features/listing/utils/price.ts': 'export const x = 1\n',
    },
    expectFailure: true,
  },
  {
    name: 'shared, импортирующий фичу, красит гейт',
    files: {
      'shared/api/send.ts': "import { role } from '../../features/auth/utils/role'\n",
      'features/auth/utils/role.ts': 'export const role = 1\n',
    },
    expectFailure: true,
  },
  {
    name: 'фича, импортирующая shared и себя, проходит',
    files: {
      'features/catalog/components/Card.tsx':
        "import { send } from '../../../shared/api/send'\nimport { price } from '../utils/price'\n",
      'features/catalog/utils/price.ts': 'export const price = 1\n',
      'shared/api/send.ts': 'export const send = 1\n',
    },
    expectFailure: false,
  },
  {
    name: 'app, импортирующий любую фичу, проходит',
    files: {
      'app/App.tsx': "import { Feed } from '../features/catalog/components/Feed'\n",
      'features/catalog/components/Feed.tsx': 'export const Feed = 1\n',
    },
    expectFailure: false,
  },
  {
    name: 'нарушение внутри __tests__ не считается',
    files: {
      'features/catalog/__tests__/fixture.ts': "import { x } from '../../listing/utils/price'\n",
      'features/listing/utils/price.ts': 'export const x = 1\n',
    },
    expectFailure: false,
  },
]

let failed = 0
for (const testCase of cases) {
  const root = build(testCase.files)
  try {
    const result = run(root)
    const red = result.status !== 0
    if (red !== testCase.expectFailure) {
      failed += 1
      console.error(
        `Самопроверка не прошла: ${testCase.name}\n` +
          `  ожидали ${testCase.expectFailure ? 'красный' : 'зелёный'}, получили код ${result.status}\n` +
          `  ${(result.stderr || result.stdout).trim()}`,
      )
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

if (failed > 0) process.exit(1)
console.log(`Самопроверка гейта границ пройдена — ${cases.length} случая.`)
