// Витрина лендинга: восемь первых объявлений ленты в том виде, в каком их читает
// карточка витрины. Данные те же, что в ленте, поэтому и перевод отдельный: витрине
// нужна шкала замеров, а карточке ленты — бейдж.
import { formatAmount, formatPrice } from '../../../shared/format/money'
import type { FeedCardWire } from '../../../shared/api/backend/feedContract'

export type Mark = 'ok' | 'none'

export interface ShowcaseCar {
  id: string
  name: string
  price: string
  meta: string
  photoUrl: string | null
  tag?: 'full' | 'import'
  panels: Mark[]
}

export const TAG_LABEL: Record<'full' | 'import', string> = {
  full: 'полная карта',
  import: 'под заказ',
}

/** Длина шкалы, когда карты замеров нет вовсе: сервер тогда не называет и число
 *  панелей, а пустая шкала выглядела бы как отсутствие кузова, а не замеров. */
const PANELS_WHEN_UNKNOWN = 13

/** Лента отдаёт только «замерено N из M» — статусов отдельных панелей в ней нет. Значит
 *  шкала витрины показывает охват, а не перекрасы: закрашенные деления — замеренные. */
function panelsOf(card: FeedCardWire): Mark[] {
  const total = card.thickness?.total_panels ?? PANELS_WHEN_UNKNOWN
  const measured = card.thickness?.measured_panels ?? 0
  return Array.from({ length: total }, (_, index) => (index < measured ? 'ok' : 'none'))
}

function metaOf(card: FeedCardWire): string {
  const parts: string[] = []
  if (card.listing_kind === 'import') {
    if (card.import_country) parts.push(card.import_country)
    if (card.turnkey_price !== null) parts.push('под ключ')
    if (card.delivery_days !== null) parts.push(`${card.delivery_days} дней`)
  } else if (card.milleage !== null) {
    parts.push(`${formatAmount(card.milleage)} км`)
  }
  if (card.transmission) parts.push(card.transmission)
  return parts.join(' · ')
}

function tagOf(card: FeedCardWire): 'full' | 'import' | undefined {
  if (card.listing_kind === 'import') return 'import'
  return card.thickness?.is_complete ? 'full' : undefined
}

export function toShowcaseCar(card: FeedCardWire): ShowcaseCar {
  const year = card.year ? `, ${card.year}` : ''
  return {
    id: card.sale_car_id,
    name: `${card.brand ?? ''} ${card.model ?? ''}`.trim() + year,
    price: formatPrice(card.price),
    meta: metaOf(card),
    photoUrl: card.preview_photo_url,
    tag: tagOf(card),
    panels: panelsOf(card),
  }
}

export const SHOWCASE_SIZE = 8
