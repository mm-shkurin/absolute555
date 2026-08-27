// Гейт границ модулей. Идёт хвостом `npm run lint` по src/ — правило и записанные
// исключения в `scripts/boundaryRules.mjs`.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative, resolve } from 'node:path'
import { areaOf, isAllowed } from './boundaryRules.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const flag = process.argv.slice(2).find((arg) => arg.startsWith('--src='))
const root = flag ? resolve(flag.slice('--src='.length)) : resolve(here, '../src')

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    // Тесты исключены: тест вправе дотянуться через границу, чтобы собрать фикстуру,
    // и это оснастка, а не зависимость, которую несёт собранный бандл.
    return /\.tsx?$/.test(path) && !path.includes('__tests__') ? [path] : []
  })
}

// Только относительные пути. Голый `react` — это пакет, а не внутренняя граница.
const RELATIVE_IMPORT = /(?:^|\n)\s*(?:import|export)[^\n]*?from '(\.[^']+)'/g

const problems = []

for (const file of sourceFiles(root)) {
  const fromRelative = relative(root, file)
  const fromArea = areaOf(fromRelative)

  for (const [, specifier] of readFileSync(file, 'utf8').matchAll(RELATIVE_IMPORT)) {
    const toRelative = relative(root, resolve(dirname(file), specifier))
    const toArea = areaOf(toRelative)
    if (isAllowed({ fromArea, toArea, fromFile: fromRelative, toPath: toRelative })) continue
    problems.push(
      `  ${fromRelative.replace(/\\/g, '/')} импортирует ${toArea} (${specifier})\n` +
        `    ${fromArea} может импортировать себя и shared. Общую часть — в shared/,` +
        ` либо добавьте строку в scripts/boundaryRules.mjs с объяснением, почему тут иначе.`,
    )
  }
}

if (problems.length > 0) {
  console.error('Границы модулей: импорт проходит сквозь стену, в которой архитектура не делала двери.')
  console.error(problems.join('\n'))
  process.exit(1)
}

console.log(
  `Границы модулей в порядке — межфичевых импортов нет в ${relative(resolve(here, '..'), root) || 'src'}.`,
)
