// Очередь модерации: что модератор видит в строке и на чём задерживает взгляд.
import { formatPrice, pluralize } from '../../../shared/format/money'
import { ratingValue } from '../../../shared/format/rating'
import type { StatusTone } from '../../../shared/ui/StatusBadge'
import type { QueueItemWire } from '../api/moderationApi'

export interface QueueRowView {
  id: string
  listingId: string
  title: string
  meta: string
  flag: string | null
  badge: string
  tone: StatusTone
}

export interface ReviewCardView {
  title: string
  facts: { label: string; value: string; mono?: boolean }[]
}

const TIME = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

export function toQueueRow(wire: QueueItemWire): QueueRowView {
  return {
    id: wire.id,
    listingId: wire.listing_id,
    title: `${wire.title} · ${wire.year} · ${formatPrice(wire.price)}`,
    meta: metaLine(wire),
    // Жалобы вынесены отдельной строкой, а не спрятаны в подпись: объявление с жалобами
    // модератор обязан открыть раньше очереди, и найти его надо глазами, без чтения.
    flag:
      wire.complaints_count > 0
        ? `${wire.complaints_count} ${pluralize(wire.complaints_count, 'жалоба', 'жалобы', 'жалоб')}${wire.complaint_reason ? `: ${wire.complaint_reason}` : ''}`
        : null,
    badge: badgeFor(wire),
    tone: wire.complaints_count > 0 ? 'bad' : wire.is_import ? 'info' : 'wait',
  }
}

function badgeFor(wire: QueueItemWire): string {
  if (wire.complaints_count > 0) return 'жалобы'
  if (wire.is_import) return 'под заказ'
  return 'ждёт'
}

function metaLine(wire: QueueItemWire): string {
  const parts: string[] = []
  // Новый продавец назван словами, а не отсутствием рейтинга: пустое место в строке
  // читается как «данные не пришли», а не как «этот человек здесь впервые».
  parts.push(
    wire.seller_is_new
      ? `${wire.seller_name} · новый продавец`
      : `${wire.seller_name} · рейтинг ${ratingValue(wire.seller_rating)}`,
  )
  parts.push(`отправлено ${TIME.format(new Date(wire.submitted_at))}`)
  parts.push(`${wire.photos_count} ${pluralize(wire.photos_count, 'фото', 'фото', 'фото')}`)
  parts.push(
    wire.measured_panels === 0
      ? 'без карты'
      : `карта ${wire.measured_panels} из ${wire.total_panels}`,
  )
  return parts.join(' · ')
}

export function toReviewCard(wire: QueueItemWire): ReviewCardView {
  return {
    title: `${wire.title} · ${wire.year}`,
    facts: [
      { label: 'VIN', value: wire.vin_masked ?? 'нет — машина под заказ', mono: true },
      {
        label: 'Фото',
        value: `${wire.photos_count} · ${wire.photos_plate_hidden ? 'номер закрыт' : 'номер виден'}`,
      },
      {
        label: 'Карта замеров',
        value:
          wire.measured_panels === 0
            ? 'не заполнена'
            : `${wire.measured_panels} из ${wire.total_panels}`,
      },
      { label: 'Телефон', value: wire.phone_hidden ? 'скрыт продавцом' : 'показан в карточке' },
      { label: 'Цена', value: formatPrice(wire.price) },
    ],
  }
}
