// Числа, которые человек читает глазами: цена, пробег, микроны. Одно место на приложение —
// цена в ленте, в карточке и в списке офферов обязана выглядеть одинаково, иначе
// «3 700 000» и «3700000» на одном экране читаются как разные суммы.

// Узкий неразрывный пробел (U+202F): цена не переносится на две строки посреди числа,
// а разряды всё равно разделены.
const GROUP = '\u202F'

export function formatAmount(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, GROUP)
}

export function formatPrice(value: number): string {
  return `${formatAmount(value)} ₽`
}

// Согласование существительного с числом. Правило русского счёта одно на весь интерфейс,
// а форм у каждого слова три.
export function pluralize(count: number, one: string, few: string, many: string): string {
  const tail = count % 100
  const last = count % 10
  if (tail >= 11 && tail <= 14) return many
  if (last === 1) return one
  if (last >= 2 && last <= 4) return few
  return many
}
