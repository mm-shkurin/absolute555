// Своё объявление глазами владельца. Вторая строка у каждого состояния своя: черновику
// важен шаг, опубликованному — торг, отклонённому — причина.
import { formatAmount, formatPrice, pluralize } from '../../../shared/format/money'
import type { StatusTone } from '../../../shared/ui/StatusBadge'
import type { ListingStatus, MyListingWire } from '../api/myListingsApi'

export interface MyListingAction {
  id: 'open' | 'offers' | 'continue' | 'fix' | 'preview' | 'republish'
  label: string
  primary?: boolean
}

export interface MyListingRowView {
  id: string
  title: string
  meta: string
  badge: string
  tone: StatusTone
  actions: MyListingAction[]
  reason: string | null
  faded: boolean
}

const TONE: Record<ListingStatus, StatusTone> = {
  draft: 'info',
  moderation: 'wait',
  published: 'ok',
  rejected: 'bad',
  withdrawn: 'info',
  sold: 'past',
}

const LABEL: Record<ListingStatus, string> = {
  draft: 'черновик',
  moderation: 'на модерации',
  published: 'опубликовано',
  rejected: 'отклонено',
  withdrawn: 'снято с публикации',
  sold: 'продано',
}

export const STATUS_TABS: { id: ListingStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'draft', label: 'Черновики' },
  { id: 'moderation', label: 'На модерации' },
  { id: 'published', label: 'Опубликованные' },
  { id: 'rejected', label: 'Отклонённые' },
  { id: 'sold', label: 'Проданные' },
]

export function countByStatus(items: MyListingWire[], status: ListingStatus | 'all'): number {
  return status === 'all' ? items.length : filterByStatus(items, status).length
}

// Вкладка «Черновики» собирает и снятое: для продавца это одна стопка — то, что сейчас
// не продаётся и ждёт его руки.
const ON_TAB: Partial<Record<ListingStatus, ListingStatus[]>> = {
  draft: ['draft', 'withdrawn'],
}

export function filterByStatus(
  items: MyListingWire[],
  status: ListingStatus | 'all',
): MyListingWire[] {
  if (status === 'all') return items
  const wanted = ON_TAB[status] ?? [status]
  return items.filter((item) => wanted.includes(item.status))
}

export function toMyListingRow(wire: MyListingWire): MyListingRowView {
  return {
    id: wire.id,
    title: `${wire.title} · ${wire.year}`,
    meta: metaFor(wire),
    badge: LABEL[wire.status],
    tone: TONE[wire.status],
    actions: actionsFor(wire.status),
    // Причина отказа показывается текстом прямо в строке, а не за кнопкой: её надо
    // прочитать, чтобы понять, что делать дальше, и прятать её незачем.
    reason: wire.status === 'rejected' ? wire.rejection_reason : null,
    faded: wire.status === 'sold',
  }
}

function metaFor(wire: MyListingWire): string {
  if (wire.status === 'draft') {
    const step = wire.draft_step ?? 0
    return `Заполнено ${step} ${pluralize(step, 'шаг', 'шага', 'шагов')} из ${wire.total_steps ?? 6}`
  }
  if (wire.status === 'sold') {
    const price = wire.sold_price === null ? '' : ` за ${formatPrice(wire.sold_price)}`
    const buyer = wire.buyer_name ? ` · покупатель ${wire.buyer_name}` : ''
    return `Продано${price}${buyer}`
  }
  const parts: string[] = []
  if (wire.price !== null) parts.push(formatPrice(wire.price))
  if (wire.mileage_km !== null) parts.push(`${formatAmount(wire.mileage_km)} км`)
  if (wire.status === 'published') {
    if (wire.new_offers > 0)
      parts.push(
        `${wire.new_offers} ${pluralize(wire.new_offers, 'новое предложение', 'новых предложения', 'новых предложений')}`,
      )
    if (wire.unread_messages > 0)
      parts.push(
        `${wire.unread_messages} ${pluralize(wire.unread_messages, 'непрочитанное сообщение', 'непрочитанных сообщения', 'непрочитанных сообщений')}`,
      )
  }
  if (parts.length < 3) parts.push(`карта ${wire.measured_panels} из ${wire.total_panels}`)
  return parts.join(' · ')
}

function actionsFor(status: ListingStatus): MyListingAction[] {
  if (status === 'draft') return [{ id: 'continue', label: 'Продолжить', primary: true }]
  if (status === 'moderation') return [{ id: 'preview', label: 'Как выглядит' }]
  // Отклонённое чинится через возврат в черновик: сервер запрещает отправку из
  // `rejected`, и «исправить» без этого шага упиралось бы в отказ на последнем нажатии.
  if (status === 'rejected') return [{ id: 'fix', label: 'Исправить и отправить', primary: true }]
  // Снятое возвращают в продажу целиком — правки оно не требует, а мастер требовал бы
  // пройти шесть шагов ради одного решения.
  if (status === 'withdrawn')
    return [
      { id: 'republish', label: 'Вернуть в продажу', primary: true },
      { id: 'continue', label: 'Доработать' },
    ]
  if (status === 'published')
    return [
      { id: 'open', label: 'Открыть' },
      { id: 'offers', label: 'Офферы' },
    ]
  return [{ id: 'open', label: 'Открыть' }]
}
