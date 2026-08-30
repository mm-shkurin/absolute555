// Заявка и отклики в читаемом виде.
import { formatAmount, formatPrice, pluralize } from '../../../shared/format/money'
import { ratingValue } from '../../../shared/format/rating'
import type { BidWire, RequestWire } from '../api/requestApi'

export interface SpecRow {
  label: string
  value: string
}

export interface RequestView {
  id: string
  title: string
  subtitle: string
  active: boolean
  ownedByMe: boolean
  specs: SpecRow[]
  comment: string | null
}

export interface BidView {
  id: string
  supplierId: string
  name: string
  rating: number | null
  ratingLine: string
  comment: string
  price: string
  terms: string
  // Дешевле всех — не то же самое, что лучше всех: срок и репутация тоже в строке. Но
  // пометка нужна, иначе три числа рядом сравниваются в уме на каждом отклике.
  cheapest: boolean
}

const DATE = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const DASH = '—'

export function toRequestView(wire: RequestWire): RequestView {
  return {
    id: wire.id,
    title: wire.title,
    subtitle: `Заявка на привоз · создана ${DATE.format(new Date(wire.created_at))}`,
    active: wire.active,
    ownedByMe: wire.owned_by_me,
    specs: [
      { label: 'Марка и модель', value: wire.title },
      { label: 'Год', value: wire.years },
      {
        label: 'Бюджет под ключ',
        value: wire.budget_max === null ? 'не назван' : `до ${formatPrice(wire.budget_max)}`,
      },
      {
        label: 'Пробег',
        value: wire.mileage_max_km === null ? DASH : `до ${formatAmount(wire.mileage_max_km)} км`,
      },
      {
        label: 'Откуда',
        value: wire.countries.length > 0 ? wire.countries.join(', ') : 'откуда угодно',
      },
      {
        label: 'Готов ждать',
        value:
          wire.wait_days_max === null
            ? 'без ограничения'
            : `до ${wire.wait_days_max} ${pluralize(wire.wait_days_max, 'дня', 'дней', 'дней')}`,
      },
    ],
    comment: wire.comment,
  }
}

export function toBidViews(bids: BidWire[]): BidView[] {
  const best = bids.length === 0 ? null : Math.min(...bids.map((bid) => bid.price))
  return bids.map((bid) => ({
    id: bid.id,
    supplierId: bid.supplier_id,
    name: bid.supplier_name,
    rating: bid.rating,
    ratingLine: `${ratingValue(bid.rating)} · ${bid.deliveries_count} ${pluralize(
      bid.deliveries_count,
      'поставка',
      'поставки',
      'поставок',
    )}`,
    comment: bid.comment,
    price: formatPrice(bid.price),
    terms: `под ключ · ${bid.delivery_days} ${pluralize(bid.delivery_days, 'день', 'дня', 'дней')}`,
    cheapest: bid.price === best,
  }))
}

export function bidsTitle(count: number): string {
  return `Отклики поставщиков · ${count}`
}
