// Три вида карточек одной ленты и подпись над ней.
import { formatPrice, pluralize } from '../../../shared/format/money'
import { ratingValue } from '../../../shared/format/rating'
import type { ImportFeedWire, ImportRequestCardWire, SupplierWire } from '../api/importApi'

export interface SupplierCardView {
  id: string
  name: string
  rating: number | null
  ratingLine: string
  scope: string
  terms: string
}

export interface RequestCardView {
  id: string
  title: string
  spec: string
  budget: string
  meta: string
}

const DATE = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })

// Счётчик ленты называет все три сущности сразу: человек, пришедший за машиной, должен
// увидеть, что здесь есть и поставщики, и чужие заявки, не переключая вкладку.
export function importCountLine(wire: ImportFeedWire): string {
  const parts = [
    `${wire.cars_total} ${pluralize(wire.cars_total, 'позиция', 'позиции', 'позиций')}`,
    `${wire.suppliers_total} ${pluralize(wire.suppliers_total, 'поставщик', 'поставщика', 'поставщиков')}`,
    `${wire.requests_total} ${pluralize(wire.requests_total, 'заявка', 'заявки', 'заявок')}`,
  ]
  return parts.join(' · ')
}

export function toSupplierCard(wire: SupplierWire): SupplierCardView {
  return {
    id: wire.id,
    name: wire.name,
    rating: wire.rating,
    ratingLine: `${ratingValue(wire.rating)} · ${wire.deliveries_count} ${pluralize(
      wire.deliveries_count,
      'поставка',
      'поставки',
      'поставок',
    )}`,
    scope: `${wire.countries.join(', ')} · ${wire.brands.join(', ')}`,
    // Срок и предоплата стоят рядом: это два числа, по которым поставщиков сравнивают,
    // и разнести их значило бы заставить сравнивать в два прохода.
    terms: `${wire.delivery_days} · предоплата ${wire.prepayment_percent}%`,
  }
}

export function toRequestCard(wire: ImportRequestCardWire, now: Date): RequestCardView {
  return {
    id: wire.id,
    title: wire.title,
    spec: [wire.years, wire.extra].filter(Boolean).join(' · '),
    budget: wire.budget_max === null ? 'бюджет не назван' : `до ${formatPrice(wire.budget_max)}`,
    meta: `${wire.responses_count} ${pluralize(wire.responses_count, 'отклик', 'отклика', 'откликов')} · создана ${createdWord(new Date(wire.created_at), now)}`,
  }
}

function createdWord(at: Date, now: Date): string {
  const days = Math.round((startOfDay(now).getTime() - startOfDay(at).getTime()) / 86_400_000)
  if (days <= 0) return 'сегодня'
  if (days === 1) return 'вчера'
  return DATE.format(at)
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}
