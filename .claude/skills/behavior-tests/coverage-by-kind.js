// Покрытие фронта по типам кода — вход для прогноза цели цикла (loop.md, «Прогноз»).
// Запуск из frontend/ после `npx vitest run --coverage`:
//   node ../.claude/skills/behavior-tests/coverage-by-kind.js
const path = require('path')
const summary = require(path.join(process.cwd(), 'coverage', 'coverage-summary.json'))

// Доля, которую vitest честно покрывает в каждом типе: [низ, верх].
const KINDS = {
  logic: { test: /\/logic\//, reach: [0.9, 0.95] },
  hooks: { test: /\/use[A-Z]\w*\.ts$/, reach: [0.7, 0.8] },
  api: { test: /\/(api|session)\//, reach: [0.7, 0.8] },
  tsx: { test: /\.tsx$/, reach: [0.25, 0.4] },
  other: { test: /./, reach: [0.6, 0.7] },
}

const rows = Object.fromEntries(Object.keys(KINDS).map((kind) => [kind, { covered: 0, total: 0 }]))
const areas = {}

for (const [file, value] of Object.entries(summary)) {
  if (file === 'total') continue
  const normalized = file.split(path.sep).join('/')
  // tsx проверяется раньше api: компонент в папке api — всё равно компонент.
  const kind = ['tsx', 'logic', 'hooks', 'api', 'other'].find((k) => KINDS[k].test.test(normalized))
  rows[kind].covered += value.lines.covered
  rows[kind].total += value.lines.total
  const area = normalized.match(/src\/((?:features|shared)\/[^/]+|[^/]+)/)?.[1] ?? 'root'
  areas[area] = (areas[area] ?? 0) + value.lines.total - value.lines.covered
}

const pct = (part, whole) => (whole ? ((100 * part) / whole).toFixed(1) : '0.0')
let low = 0
let high = 0
let total = 0
let covered = 0
console.log('| Тип | Строк | Сейчас | Реалистично | Строк будет |')
console.log('|---|---|---|---|---|')
for (const [kind, { covered: c, total: t }] of Object.entries(rows)) {
  const [lo, hi] = KINDS[kind].reach
  const from = Math.max(c, Math.round(t * lo))
  const to = Math.max(c, Math.round(t * hi))
  low += from
  high += to
  total += t
  covered += c
  console.log(`| ${kind} | ${t} | ${pct(c, t)}% | ${lo * 100}–${hi * 100}% | ${from}–${to} |`)
}
console.log(`| **Итого** | **${total}** | **${pct(covered, total)}%** | | **${pct(low, total)}–${pct(high, total)}%** |`)
console.log('')
console.log('Очередь (непокрытых строк):')
Object.entries(areas)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 12)
  .forEach(([area, miss]) => console.log(`  ${miss} ${area}`))
