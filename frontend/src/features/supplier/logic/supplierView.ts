// Условия поставщика таблицей: по этим строкам его и сравнивают с другими.
import { ratingLine } from '../../../shared/format/rating'
import { pluralize } from '../../../shared/format/money'
import type { SupplierPageWire } from '../api/supplierApi'

export interface TermRow {
  label: string
  value: string
}

export interface SupplierView {
  id: string
  name: string
  rating: number | null
  line: string
  terms: TermRow[]
  about: string | null
  listingsTitle: string
  reviewsTitle: string
}

export function toSupplierView(wire: SupplierPageWire): SupplierView {
  const { profile, seller } = wire
  const days =
    profile.delivery_days_min === null || profile.delivery_days_max === null
      ? 'не указан'
      : `${profile.delivery_days_min}–${profile.delivery_days_max} дней`
  return {
    id: profile.user_id,
    // Имя компании — то, чем поставщик подписывает витрину; имя человека остаётся
    // запасным: профиль без названия всё равно должен как-то называться.
    name: profile.company_name ?? seller.name ?? 'Поставщик',
    rating: seller.rating,
    line: ratingLine(seller.rating, seller.deals_count, seller.member_since ?? ''),
    terms: [
      { label: 'Страны', value: profile.countries.join(', ') || 'не указаны' },
      { label: 'Марки', value: profile.brands.join(', ') || 'любые' },
      { label: 'Срок доставки', value: days },
      // Порядок расчётов приходит текстом: у каждого поставщика он свой, и процент
      // предоплаты полем заставил бы всех уложиться в одно правило.
      { label: 'Условия', value: profile.terms ?? 'по договорённости' },
    ],
    about: profile.description,
    listingsTitle: `Позиции под привоз · ${wire.listings.length}`,
    reviewsTitle: `Отзывы · ${seller.reviews_count}`,
  }
}

// Строка про поставки склоняется отдельно от строки про сделки продавца: возят машины, а
// не заключают сделки, и «18 сделок» у перегонщика читается как чужое слово.
export function deliveriesLabel(count: number): string {
  return `${count} ${pluralize(count, 'поставка', 'поставки', 'поставок')}`
}
