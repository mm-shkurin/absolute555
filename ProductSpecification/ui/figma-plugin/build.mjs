// Сборка плагина: склейка исходников в один dist/code.js.
//
// Figma грузит ровно один файл и не умеет ES-модули в коде плагина. Альтернативы две:
// держать всё одним файлом на семьсот строк (упирается в правило двухсот строк и читается
// плохо) или собрать бандлером (лишняя зависимость ради конкатенации). Порядок файлов
// важен — он и есть порядок объявлений.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

const ORDER = ['tokens.js', 'build-tokens.js', 'primitives.js', 'components.js', 'screens.js', 'screens-feed.js', 'screens-thickness.js', 'main.js']

const parts = ORDER.map((name) => {
  const body = readFileSync(join(here, 'src', name), 'utf8')
  return `// ─────────── ${name} ───────────\n${body}`
})

const header = [
  '// СГЕНЕРИРОВАННЫЙ ФАЙЛ. Не править — правки затрёт следующая сборка.',
  '// Источник: ProductSpecification/ui/figma-plugin/src/*.js, сборка: node build.mjs',
  '',
].join('\n')

mkdirSync(join(here, 'dist'), { recursive: true })
writeFileSync(join(here, 'dist', 'code.js'), header + parts.join('\n\n'), 'utf8')

const lines = parts.reduce((total, part) => total + part.split('\n').length, 0)
console.log(`dist/code.js собран из ${ORDER.length} файлов, ${lines} строк.`)
