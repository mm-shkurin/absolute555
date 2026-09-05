// Даты, приходящие с провода, — и то, что делать, когда даты нет.
//
// Написано после падения консоли модерации на живых данных: объявление, попавшее на
// проверку в обход мастера, приходит с `submitted_at: null`, экран делал `new Date('')`
// и звал `Intl.DateTimeFormat.format()`. Тот бросает `RangeError: Invalid time value` —
// не возвращает пустую строку, а именно бросает, — и падало не поле, а всё поддерево:
// вместо очереди из четырёхсот объявлений человек видел пустую страницу без шапки.
//
// Поэтому форматирование даты в этом приложении идёт только отсюда: `null`, пустая
// строка и мусор дают пустой результат, а вызывающий решает, что показать вместо даты.

const DAY_MONTH = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const MONTH_YEAR = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })
const HOURS_MINUTES = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })
const SHORT_DAY = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

/** Дата, если её вообще можно прочитать. Иначе `null` — и это ответ, а не отказ. */
export function parseMoment(value: string | null | undefined): Date | null {
  if (!value) return null
  const at = new Date(value)
  return Number.isNaN(at.getTime()) ? null : at
}

function safely(format: Intl.DateTimeFormat, value: string | null | undefined): string {
  const at = parseMoment(value)
  return at ? format.format(at) : ''
}

/** «3 сентября». Пусто, если даты нет. */
export function dayAndMonth(value: string | null | undefined): string {
  return safely(DAY_MONTH, value)
}

/** «сентябрь 2026 г.» */
export function monthAndYear(value: string | null | undefined): string {
  return safely(MONTH_YEAR, value)
}

/** «14:05» */
export function hoursAndMinutes(value: string | null | undefined): string {
  return safely(HOURS_MINUTES, value)
}

/** «03.09.2026» */
export function shortDay(value: string | null | undefined): string {
  return safely(SHORT_DAY, value)
}
