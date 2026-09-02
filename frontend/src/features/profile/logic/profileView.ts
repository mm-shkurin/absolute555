// Профиль в том виде, в каком он читается: строка под именем, четыре плитки разделов и
// состояние заявки на роль поставщика.
import { formatPrice, pluralize } from '../../../shared/format/money'
import { ratingLine, reviewsLabel, ratingValue } from '../../../shared/format/rating'
import type { StatusTone } from '../../../shared/ui/StatusBadge'
import type { ImportRequestWire, ProfileWire, SupplierApplicationStatus } from '../api/profileApi'

export interface ShortcutView {
  id: 'listings' | 'offers' | 'chats' | 'reviews'
  title: string
  meta: string
}

export interface SupplierStateView {
  badge: string | null
  tone: StatusTone
  invitation: boolean
  /** Роль уже выдана: только тогда есть что заполнять в витрине (история 16). */
  approved: boolean
}

export interface ImportRequestView {
  id: string
  title: string
  meta: string
  responses: string
  badge: string
  tone: StatusTone
}

export interface ProfileView {
  name: string
  rating: number | null
  line: string
  shortcuts: ShortcutView[]
  supplier: SupplierStateView
  requests: ImportRequestView[]
}

const DATE = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })

export function toProfileView(wire: ProfileWire): ProfileView {
  return {
    name: wire.name,
    rating: wire.rating,
    line: ratingLine(wire.rating, wire.deals_count, wire.member_since),
    shortcuts: shortcuts(wire),
    supplier: supplierState(wire.supplier_status, wire.supplier_applied_at),
    requests: wire.import_requests.map(toRequestView),
  }
}

// Вторая строка плитки — не подпись раздела, а причина туда зайти: сколько там ждёт
// решения. Раздел без событий говорит об этом прямо, а не молчит.
function shortcuts(wire: ProfileWire): ShortcutView[] {
  const listings =
    wire.listings_count === 0
      ? 'ещё ни одного'
      : `${wire.listings_count}${wire.rejected_listings > 0 ? ` · ${wire.rejected_listings} отклонено` : ''}`
  return [
    { id: 'listings', title: 'Мои объявления', meta: listings },
    {
      id: 'offers',
      title: 'Мои офферы',
      meta: `${wire.incoming_offers} полученных, ${wire.outgoing_offers} отправленных`,
    },
    {
      id: 'chats',
      title: 'Чаты',
      meta:
        wire.unread_messages === 0
          ? 'всё прочитано'
          : `${wire.unread_messages} ${pluralize(wire.unread_messages, 'непрочитанное', 'непрочитанных', 'непрочитанных')}`,
    },
    {
      id: 'reviews',
      title: 'Отзывы обо мне',
      meta:
        wire.reviews_count === 0
          ? 'отзывов пока нет'
          : `${reviewsLabel(wire.reviews_count)} · средняя ${ratingValue(wire.rating)}`,
    },
  ]
}

function supplierState(
  status: SupplierApplicationStatus,
  appliedAt: string | null,
): SupplierStateView {
  const since = appliedAt ? ` с ${DATE.format(new Date(appliedAt))}` : ''
  if (status === 'pending')
    return {
      badge: `заявка на рассмотрении${since}`,
      tone: 'wait',
      invitation: false,
      approved: false,
    }
  if (status === 'approved')
    return { badge: 'вы поставщик', tone: 'ok', invitation: false, approved: true }
  if (status === 'rejected')
    return { badge: 'заявка отклонена', tone: 'bad', invitation: true, approved: false }
  return { badge: null, tone: 'info', invitation: true, approved: false }
}

function toRequestView(wire: ImportRequestWire): ImportRequestView {
  const budget = wire.budget_max === null ? null : `бюджет до ${formatPrice(wire.budget_max)}`
  const created = `создана ${DATE.format(new Date(wire.created_at))}`
  return {
    id: wire.id,
    title: wire.title,
    meta: [budget, created].filter(Boolean).join(' · '),
    responses: `${wire.responses_count} ${pluralize(wire.responses_count, 'отклик', 'отклика', 'откликов')}`,
    badge: wire.active ? 'активна' : 'закрыта',
    tone: wire.active ? 'info' : 'past',
  }
}
