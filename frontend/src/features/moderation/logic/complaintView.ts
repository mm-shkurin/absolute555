// Жалобы копятся на объявление, а не на человека: одна и та же карточка собирает разные
// претензии, и решение принимается по их совокупности.
import { formatPrice, pluralize } from '../../../shared/format/money'
import { ratingValue } from '../../../shared/format/rating'
import type { ComplaintCaseWire, ComplaintWire } from '../api/moderationApi'

export interface ComplaintView {
  id: string
  author: string
  meta: string
  body: string
}

export interface ComplaintCaseView {
  listingId: string
  title: string
  seller: string
  count: string
  complaints: ComplaintView[]
}

const DATE = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const TIME = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

export function toComplaintCase(wire: ComplaintCaseWire, now: Date): ComplaintCaseView {
  return {
    listingId: wire.listing_id,
    title: `${wire.title} · ${wire.year} · ${formatPrice(wire.price)}`,
    seller: `${wire.seller_name} · рейтинг ${ratingValue(wire.seller_rating)} · опубликовано ${DATE.format(new Date(wire.published_at))}`,
    count: `${wire.complaints.length} ${pluralize(wire.complaints.length, 'жалоба', 'жалобы', 'жалоб')}`,
    complaints: wire.complaints.map((complaint) => toComplaint(complaint, now)),
  }
}

function toComplaint(wire: ComplaintWire, now: Date): ComplaintView {
  const at = new Date(wire.created_at)
  const days = Math.round((startOfDay(now).getTime() - startOfDay(at).getTime()) / 86_400_000)
  const when =
    days <= 0
      ? `сегодня, ${TIME.format(at)}`
      : days === 1
        ? `вчера, ${TIME.format(at)}`
        : DATE.format(at)
  return {
    id: wire.id,
    author: wire.author_name,
    // Причина стоит в подписи рядом с автором: она задаёт, что читать в тексте ниже.
    meta: `· ${when} · причина: ${wire.reason}`,
    body: wire.body,
  }
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}
