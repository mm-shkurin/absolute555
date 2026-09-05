// Жалобы копятся на объявление, а не на человека: одна и та же карточка собирает разные
// претензии, и решение принимается по их совокупности.
import { dayAndMonth, hoursAndMinutes, parseMoment } from '../../../shared/format/dates'
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


export function toComplaintCase(wire: ComplaintCaseWire, now: Date): ComplaintCaseView {
  return {
    listingId: wire.listing_id,
    title: `${wire.title} · ${wire.year} · ${formatPrice(wire.price)}`,
    seller: `${wire.seller_name} · рейтинг ${ratingValue(wire.seller_rating)} · опубликовано ${dayAndMonth(wire.published_at)}`,
    count: `${wire.complaints.length} ${pluralize(wire.complaints.length, 'жалоба', 'жалобы', 'жалоб')}`,
    complaints: wire.complaints.map((complaint) => toComplaint(complaint, now)),
  }
}

function toComplaint(wire: ComplaintWire, now: Date): ComplaintView {
  const at = parseMoment(wire.created_at)
  // Жалоба без даты — не повод не показать жалобу: модератор разбирает её содержание.
  const days = at
    ? Math.round((startOfDay(now).getTime() - startOfDay(at).getTime()) / 86_400_000)
    : null
  const when =
    days === null
      ? ''
      : days <= 0
        ? `сегодня, ${hoursAndMinutes(wire.created_at)}`
        : days === 1
          ? `вчера, ${hoursAndMinutes(wire.created_at)}`
          : dayAndMonth(wire.created_at)
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
