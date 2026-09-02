// Продавец и отзывы о нём.
import { ratingLine, reviewsLabel } from '../../../shared/format/rating'
import type { ReviewWire, SellerProfileWire } from '../api/sellerApi'

export interface ReviewView {
  id: string
  author: string
  rating: number
  meta: string
  body: string
}

const DATE = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const MONTH = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })

export function sellerLine(wire: SellerProfileWire): string {
  // Сделки, а не отзывы: сделка бывает без отзыва, и подменять одно другим значит
  // приписывать продавцу молчание покупателей как отсутствие опыта.
  // Дата с провода — ISO; в строку она идёт месяцем и годом: день регистрации ничего не
  // говорит о продавце, а «на площадке с 2024-03-14T09:12:00Z» не читается вовсе.
  const since = wire.member_since ? MONTH.format(new Date(wire.member_since)) : null
  return ratingLine(wire.rating, wire.deals_count, since)
}

export function reviewsTitle(count: number): string {
  return `Отзывы покупателей · ${count}`
}

export function toReviewView(wire: ReviewWire): ReviewView {
  return {
    id: wire.review_id,
    author: wire.author?.name ?? 'Покупатель',
    rating: wire.rating,
    // Машины, по которой написан отзыв, в выдаче нет — только её идентификатор. Дата
    // одна честнее выдуманного заголовка.
    meta: `· ${DATE.format(new Date(wire.created_at))}`,
    body: wire.text ?? '',
  }
}

export function reviewsCountLabel(count: number): string {
  return reviewsLabel(count)
}
