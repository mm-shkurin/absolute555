// Заявка и отклики в читаемом виде.
import { formatPrice, pluralize } from '../../../shared/format/money'
import type {
  BuyerRequestWire,
  SupplierResponseWire,
} from '../../../shared/api/backend/requestContract'

export interface SpecRow {
  label: string
  value: string
}

export interface RequestView {
  id: string
  title: string
  subtitle: string
  active: boolean
  specs: SpecRow[]
  comment: string | null
  responsesLine: string
}

export interface BidView {
  id: string
  supplierId: string
  comment: string | null
  price: string
  terms: string
  // Дешевле всех — не то же самое, что лучше всех: срок тоже в строке. Но пометка нужна,
  // иначе числа сравниваются в уме на каждом отклике.
  cheapest: boolean
}

const DATE = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const DASH = '—'

export function requestTitle(wire: BuyerRequestWire): string {
  return `${wire.brand ?? ''} ${wire.model ?? ''}`.trim() || 'Заявка на привоз'
}

export function toRequestView(wire: BuyerRequestWire): RequestView {
  return {
    id: wire.request_id,
    title: requestTitle(wire),
    subtitle: `Заявка на привоз · создана ${DATE.format(new Date(wire.created_at))}`,
    active: wire.status === 'open',
    specs: [
      { label: 'Марка и модель', value: requestTitle(wire) },
      { label: 'Год', value: wire.year_from === null ? DASH : `от ${wire.year_from}` },
      {
        // Бюджет — под ключ: заявка описывает то, что покупатель отдаст, а не цену лота
        // на аукционе, о которой он ничего не знает.
        label: 'Бюджет под ключ',
        value: wire.budget_max === null ? 'не назван' : `до ${formatPrice(wire.budget_max)}`,
      },
    ],
    comment: wire.comment,
    responsesLine: responsesLine(wire.responses_count),
  }
}

export function responsesLine(count: number): string {
  return `${count} ${pluralize(count, 'отклик', 'отклика', 'откликов')}`
}

export function bidsTitle(count: number): string {
  return `Отклики · ${count}`
}

export function toBidViews(responses: SupplierResponseWire[]): BidView[] {
  const best = responses.length === 0 ? null : Math.min(...responses.map((one) => one.price))
  return responses.map((one) => ({
    id: one.response_id,
    supplierId: one.supplier_id,
    comment: one.comment,
    price: formatPrice(one.price),
    terms: `под ключ · ${one.delivery_days} ${pluralize(one.delivery_days, 'день', 'дня', 'дней')}`,
    cheapest: one.price === best,
  }))
}
