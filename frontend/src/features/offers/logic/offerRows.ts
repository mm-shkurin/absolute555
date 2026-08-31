// Оффер в том виде, в каком его читает человек: сумма, насколько она ниже цены, состояние
// и сколько осталось до истечения.
import { formatPrice, pluralize } from '../../../shared/format/money'
import type { StatusTone } from '../../../shared/ui/StatusBadge'
import type { OfferDirection, OfferListItemWire, OfferStatus } from '../api/offersApi'

export interface OfferAction {
  id: 'accept' | 'reject' | 'message' | 'withdraw' | 'chat' | 'review'
  label: string
  primary?: boolean
}

export interface OfferRowView {
  id: string
  listingId: string
  title: string
  meta: string
  amount: string
  gap: string | null
  badge: string
  tone: StatusTone
  actions: OfferAction[]
  faded: boolean
}

const TONE: Record<OfferStatus, StatusTone> = {
  pending: 'wait',
  accepted: 'ok',
  rejected: 'bad',
  withdrawn: 'past',
  expired: 'past',
  car_sold: 'bad',
}

const LABEL: Record<OfferStatus, string> = {
  pending: 'ждёт ответа',
  accepted: 'принято',
  rejected: 'отклонено',
  withdrawn: 'отозван вами',
  expired: 'истёк',
  car_sold: 'машину продали',
}

// Живой оффер требует решения, закончившийся — только памяти о себе. Приглушение строки
// делает список читаемым сверху вниз без чтения каждой плашки.
function isLive(status: OfferStatus): boolean {
  return status === 'pending'
}

export function toOfferRow(
  wire: OfferListItemWire,
  direction: OfferDirection,
  now: Date,
): OfferRowView {
  const status = wire.status
  const left = daysLeft(wire.expires_at, now)
  return {
    id: wire.id,
    listingId: wire.listing_id,
    title: `${wire.listing_title} · ${wire.listing_year}`,
    meta: metaLine(wire, direction),
    amount: formatPrice(wire.amount),
    gap: gapLine(wire),
    badge: status === 'pending' && left !== null ? `${LABEL[status]} · ${left}` : LABEL[status],
    tone: TONE[status],
    actions: actionsFor(status, direction),
    faded: !isLive(status),
  }
}

function metaLine(wire: OfferListItemWire, direction: OfferDirection): string {
  const who =
    direction === 'incoming'
      ? wire.counterparty_rating === null
        ? wire.counterparty_name
        : `${wire.counterparty_name} · рейтинг ${wire.counterparty_rating.toFixed(1).replace('.', ',')}`
      : `Продавец ${wire.counterparty_name}`
  return who
}

function gapLine(wire: OfferListItemWire): string | null {
  const gap = wire.listing_price - wire.amount
  if (gap <= 0) return null
  return `на ${formatPrice(gap)} ниже`
}

function daysLeft(expiresAt: string | null, now: Date): string | null {
  if (!expiresAt) return null
  const ms = new Date(expiresAt).getTime() - now.getTime()
  if (ms <= 0) return 'истекает сегодня'
  const days = Math.ceil(ms / 86_400_000)
  return `${days} ${pluralize(days, 'день', 'дня', 'дней')}`
}

function actionsFor(status: OfferStatus, direction: OfferDirection): OfferAction[] {
  if (direction === 'incoming') {
    if (status !== 'pending') return []
    return [
      { id: 'accept', label: 'Принять', primary: true },
      { id: 'reject', label: 'Отклонить' },
      { id: 'message', label: 'Написать' },
    ]
  }
  if (status === 'pending')
    return [
      { id: 'withdraw', label: 'Отозвать' },
      { id: 'message', label: 'Написать' },
    ]
  // Отзыв оставляют только после принятого предложения — это единственный момент, когда
  // сделка точно была.
  if (status === 'accepted')
    return [
      { id: 'chat', label: 'Открыть чат', primary: true },
      { id: 'review', label: 'Оставить отзыв' },
    ]
  return []
}
