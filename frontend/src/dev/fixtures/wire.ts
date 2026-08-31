// Фикстуры в форме настоящего провода.
//
// Прежние заглушки отвечали на выдуманные адреса (`/listings`, `/chats`, `/users/me`), и
// когда экраны переехали на `/sale_car`, `/chat`, `/user/profile`, мок замолчал вместе с
// браузерными сценариями. Здесь те же демонстрационные данные, но в формах из
// `api-specs/`: расхождение с сервером теперь видно и в заглушке.
import type { DialogWire, MessageWire } from '../../shared/api/backend/chatContract'
import type { FeedCardWire, FeedPageWire } from '../../shared/api/backend/feedContract'
import type { OfferWire } from '../../shared/api/backend/offerContract'
import type { SaleCarWire } from '../../shared/api/backend/saleCarContract'
import type { UserWire } from '../../shared/api/backend/accountContract'
import type {
  ComplaintPageWire,
  QueueCountsWire,
  QueuePageWire,
} from '../../shared/api/backend/moderationContract'
import { FEED } from './cars'
import { CHATS, MESSAGES } from './rest'
import { COMPLAINTS, QUEUE } from './moderation'
import { PROFILE, offers as offerFixtures } from './people'

const HOURS = 3_600_000

export const VIEWER_ID = 'u1'

function toCard(car: (typeof FEED)[number]): FeedCardWire {
  return {
    sale_car_id: car.id,
    brand: car.brand,
    model: car.model,
    year: car.year,
    price: car.price,
    milleage: car.mileage_km,
    transmission: car.transmission,
    status: 'published',
    preview_photo_url: car.photo_url,
    published_at: new Date(Date.now() - 30 * HOURS).toISOString(),
  }
}

const number = (value: string | null): number | null => {
  const parsed = Number(value ?? '')
  return value && Number.isFinite(parsed) ? parsed : null
}

// Фильтры работают по-настоящему: иначе пустое состояние ленты — единственное, которое
// нельзя увидеть, а именно оно чаще всего и ломается.
export function feedPage(query: URLSearchParams): FeedPageWire {
  const priceFrom = number(query.get('price_from'))
  const priceTo = number(query.get('price_to'))
  const yearFrom = number(query.get('year_from'))
  const gearboxes = query.getAll('transmission')

  let items = FEED.map(toCard).filter((card) => {
    if (priceFrom !== null && (card.price ?? 0) < priceFrom) return false
    if (priceTo !== null && (card.price ?? 0) > priceTo) return false
    if (yearFrom !== null && (card.year ?? 0) < yearFrom) return false
    if (gearboxes.length > 0 && !gearboxes.includes(card.transmission ?? '')) return false
    return true
  })

  const sort = query.get('sort') ?? 'newest'
  if (sort === 'price_asc') items = items.toSorted((a, b) => (a.price ?? 0) - (b.price ?? 0))
  if (sort === 'price_desc') items = items.toSorted((a, b) => (b.price ?? 0) - (a.price ?? 0))

  const size = number(query.get('size')) ?? 20
  const page = number(query.get('page')) ?? 1
  return { items: items.slice((page - 1) * size, page * size), total: items.length, page, size }
}

export function saleCar(saleCarId: string): SaleCarWire | null {
  const card = FEED.map(toCard).find((item) => item.sale_car_id === saleCarId)
  if (!card) return null
  return {
    ...card,
    // Своим считается третье объявление, а не первое: первое открывает лента в браузерных
    // сценариях, и владельцу вместо колонки с торгом показалась бы панель управления.
    user_id: saleCarId === 'l3' ? VIEWER_ID : 'u9',
    vin: 'XW8ZZZ61ZJG012345',
    mark_raw: null,
    model_raw: null,
    engine_power: 249,
    task_id: null,
    task_status: null,
    phone_number: '+7 913 000-00-00',
    description: 'Один владелец, сервисная книжка, зимняя резина в комплекте.',
    reject_reason: null,
    reject_label: null,
    created_at: new Date(Date.now() - 40 * HOURS).toISOString(),
    updated_at: new Date(Date.now() - 30 * HOURS).toISOString(),
    car_data: null,
    photos: [],
    autofill: { state: 'done', brand_source: 'ocr', model_source: 'ocr', updated_at: null },
    seller: { user_id: 'u9', name: 'Дмитрий', avatar_url: null },
  }
}

const MY_STATUSES: SaleCarWire['status'][] = [
  'draft',
  'moderation',
  'published',
  'rejected',
  'sold',
]

export function myCars(): SaleCarWire[] {
  return FEED.map(toCard)
    .slice(0, MY_STATUSES.length)
    .map((card, index) => {
      const car = saleCar(card.sale_car_id) as SaleCarWire
      const status = MY_STATUSES[index]
      const rejected = status === 'rejected'
      car.status = status
      car.user_id = VIEWER_ID
      car.reject_reason = rejected ? 'Видны номера на фотографиях' : null
      car.reject_label = rejected ? 'plate_or_face_visible' : null
      return car
    })
}

export function myOffers(): OfferWire[] {
  return offerFixtures('outgoing').items.map((offer) => ({
    offer_id: offer.id,
    sale_car_id: offer.listing_id,
    user_id: VIEWER_ID,
    price: offer.amount,
    status: offer.status,
    expires_at: offer.expires_at,
    created_at: offer.created_at,
    updated_at: null,
  }))
}

export function carOffers(saleCarId: string): OfferWire[] {
  return offerFixtures('incoming').items.map((offer) => ({
    offer_id: offer.id,
    sale_car_id: saleCarId,
    user_id: 'u9',
    price: offer.amount,
    status: offer.status,
    expires_at: offer.expires_at,
    created_at: offer.created_at,
    updated_at: null,
  }))
}

export function user(): UserWire {
  return {
    id: VIEWER_ID,
    tg_id: null,
    vk_id: null,
    yandex_id: 'ya-1',
    device_id: null,
    tg_json: null,
    yandex_json: { real_name: PROFILE.name },
    vk_json: null,
    guest_json: null,
    user_type: 'regular',
    role: 'admin',
    is_verified: true,
    is_guest: false,
    created_at: new Date(Date.now() - 200 * 24 * HOURS).toISOString(),
    updated_at: null,
  }
}

export function queuePage(): QueuePageWire {
  const items = QUEUE.map((item, index) => ({
    ...toCard(FEED[index % FEED.length]),
    sale_car_id: item.listing_id,
    status: 'moderation' as const,
    seller: { user_id: `u${index}`, name: item.seller_name, avatar_url: null },
    open_complaints: item.complaints_count,
    submitted_at: item.submitted_at,
  }))
  return { items, total: items.length, page: 1, size: 20 }
}

export function queueCounts(): QueueCountsWire {
  return { waiting: QUEUE.length, complained: COMPLAINTS.length, handled_today: 7 }
}

export function complaintPage(): ComplaintPageWire {
  const items = COMPLAINTS.map((group, index) => ({
    sale_car_id: group.listing_id,
    listing: { ...toCard(FEED[index % FEED.length]), sale_car_id: group.listing_id },
    complaints: group.complaints.map((complaint) => ({
      complaint_id: complaint.id,
      sale_car_id: group.listing_id,
      author: { user_id: 'u7', name: complaint.author_name, avatar_url: null },
      reason: 'other' as const,
      text: complaint.body,
      status: 'open' as const,
      created_at: complaint.created_at,
      handled_at: null,
    })),
  }))
  return { items, total: items.length, page: 1, size: 20 }
}

export function dialogs(): DialogWire[] {
  return CHATS.map((chat, index) => ({
    dialog_id: chat.id,
    sale_car_id: chat.listing_id,
    listing: { ...toCard(FEED[index % FEED.length]), sale_car_id: chat.listing_id },
    counterpart: { user_id: `u${index + 2}`, name: chat.counterparty_name, avatar_url: null },
    last_message: {
      message_id: `last-${chat.id}`,
      dialog_id: chat.id,
      author_id: `u${index + 2}`,
      kind: 'text' as const,
      text: chat.last_message,
      read_at: null,
      created_at: chat.last_message_at,
    },
    unread: chat.unread_count,
  }))
}

export function messages(dialogId: string): MessageWire[] {
  return MESSAGES.map((message) => ({
    message_id: message.id,
    dialog_id: dialogId,
    author_id: message.kind === 'system' ? null : message.outgoing ? VIEWER_ID : 'u2',
    kind: message.kind,
    text: message.body,
    read_at: message.read_at,
    created_at: message.created_at,
  }))
}
