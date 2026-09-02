// Рейтинг продавца словами и звёздами. Одно место на приложение: рейтинг показывается в
// карточке объявления, в профиле и в отзывах, и три разных округления выглядели бы как
// три разных рейтинга.
import { pluralize } from './money'

// Звёзды рисуются по числу, а не пятью подряд: пятизвёздная строка у продавца с 3,2 —
// это ложь, которую видно раньше, чем подпись рядом.
export function stars(rating: number | null): string {
  const filled = rating === null ? 0 : Math.round(rating)
  return '★'.repeat(filled) + '☆'.repeat(5 - filled)
}

export function dealsLabel(count: number): string {
  return `${count} ${pluralize(count, 'сделка', 'сделки', 'сделок')}`
}

export function reviewsLabel(count: number): string {
  return `${count} ${pluralize(count, 'отзыв', 'отзыва', 'отзывов')}`
}

export function ratingValue(rating: number | null): string {
  return rating === null ? 'пока без оценок' : rating.toFixed(1).replace('.', ',')
}

// Строка под именем: оценка, сделки и с какого месяца человек на площадке. Срок здесь не
// украшение — на площадке без истории он единственное, что отличает нового продавца от
// свежерегистрированного перекупа.
export function ratingLine(rating: number | null, deals: number, since: string | null): string {
  const parts = [ratingValue(rating), dealsLabel(deals)]
  if (since) parts.push(`на площадке с ${since}`)
  return parts.join(' · ')
}
