/** Перестановка — это новый список целиком: сервер хранит порядок, а не позиции по одной.
 *  `null`, если сдвигать некуда. */
export function movedIds(ids: string[], from: number, to: number): string[] | null {
  if (to < 0 || to >= ids.length) return null
  const next = [...ids]
  const [taken] = next.splice(from, 1)
  next.splice(to, 0, taken)
  return next
}
