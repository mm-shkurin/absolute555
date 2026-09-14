// Подсказки годов в полях ввода считаются от текущего года, чтобы не устаревать
// с каждым январём.
export const OLDEST_YEAR_HINT = 2005
const REQUEST_YEAR_LOOKBACK = 4
const LISTING_YEAR_LOOKBACK = 10

export function currentYear(now: Date = new Date()): number {
  return now.getFullYear()
}

/** Пример года «от» для заявки под заказ: машина нескольких последних лет. */
export function recentYearHint(now: Date = new Date()): string {
  return String(currentYear(now) - REQUEST_YEAR_LOOKBACK)
}

/** Пример года выпуска в объявлении: машина с пробегом, не новая. */
export function listingYearHint(now: Date = new Date()): string {
  return String(currentYear(now) - LISTING_YEAR_LOOKBACK)
}
