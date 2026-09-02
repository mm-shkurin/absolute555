// Условия поставщика в виде таблицы: по этим четырём строкам его и сравнивают с другими.
import { ratingLine } from '../../../shared/format/rating'
import { pluralize } from '../../../shared/format/money'
import type { SupplierProfileWire } from '../api/supplierApi'

export interface TermRow {
  label: string
  value: string
}

export interface SupplierView {
  id: string
  name: string
  rating: number | null
  line: string
  approved: boolean
  terms: TermRow[]
  about: string | null
  listingsTitle: string
  reviewsTitle: string
}

export function toSupplierView(wire: SupplierProfileWire): SupplierView {
  return {
    id: wire.id,
    name: wire.name,
    rating: wire.rating,
    line: ratingLine(wire.rating, wire.deliveries_count, wire.member_since),
    // Одобрение площадки — не украшение: неодобренный поставщик не может публиковать
    // позиции, и покупателю важно видеть, кто перед ним.
    approved: wire.approved,
    terms: [
      { label: 'Страны', value: wire.countries.join(', ') || 'не указаны' },
      { label: 'Марки', value: wire.brands.join(', ') || 'любые' },
      { label: 'Срок доставки', value: wire.delivery_days },
      { label: 'Предоплата', value: `${wire.prepayment_percent}% при заказе` },
    ],
    about: wire.about,
    listingsTitle: `Позиции под привоз · ${wire.listings.length}`,
    reviewsTitle: `Отзывы · ${wire.reviews_count}`,
  }
}

// Строка про поставки склоняется отдельно от строки про сделки продавца: возят машины, а
// не заключают сделки, и «18 сделок» у перегонщика читается как чужое слово.
export function deliveriesLabel(count: number): string {
  return `${count} ${pluralize(count, 'поставка', 'поставки', 'поставок')}`
}
