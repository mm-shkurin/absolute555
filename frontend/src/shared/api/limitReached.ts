export function limitReachedText(details: Record<string, unknown> | undefined): string {
  const limit = details?.limit
  const count = typeof limit === 'number' ? limit : 3
  return `Открытых заявок уже ${count}. Закройте одну — и заведите новую.`
}
