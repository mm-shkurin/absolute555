// Продавец, его отзывы и право оставить свой.
import { ratingLine, reviewsLabel } from '../../../shared/format/rating'
import type { ReviewRightWire, ReviewWire, SellerWire } from '../api/sellerApi'

export interface ReviewView {
  id: string
  author: string
  rating: number
  meta: string
  body: string
}

export interface ReviewInvitation {
  allowed: boolean
  editing: boolean
  explanation: string
}

const DATE = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })

export function sellerLine(wire: SellerWire): string {
  return ratingLine(wire.rating, wire.deals_count, wire.member_since)
}

export function reviewsTitle(count: number): string {
  return `Отзывы покупателей · ${count}`
}

export function toReviewView(wire: ReviewWire): ReviewView {
  return {
    id: wire.id,
    author: wire.author_name,
    rating: wire.rating,
    // Отзыв всегда назван машиной, по которой он написан: без неё оценка «4» ни к чему не
    // относится, а с ней читается как история одной сделки.
    meta: `· ${DATE.format(new Date(wire.created_at))} · ${wire.listing_title}`,
    body: wire.body,
  }
}

// Имя продавца в текст не подставляется: «купили у Михаил» — единственный вариант, который
// код может выдать без склонения, а склонять русское имя по правилам он не умеет.
export function toInvitation(right: ReviewRightWire): ReviewInvitation {
  if (!right.can_review)
    return {
      allowed: false,
      editing: false,
      explanation:
        'Отзыв можно оставить только по принятому предложению. Поэтому их мало — и поэтому им можно верить.',
    }
  const when = right.deal_closed_at ? DATE.format(new Date(right.deal_closed_at)) : null
  const what = right.deal_listing_title ?? 'машину'
  return {
    allowed: true,
    editing: right.existing_review_id !== null,
    explanation: `Вы купили у этого продавца ${what}${when ? ` ${when}` : ''}. Оценка появится в его профиле и в карточке каждого его объявления.`,
  }
}

export function reviewsCountLabel(count: number): string {
  return reviewsLabel(count)
}
