import type { ChatWire, MessageWire } from '../../features/chats/api/chatsApi'
import type { SupplierProfileWire } from '../../features/supplier/api/supplierApi'
import type { BidWire, RequestWire } from '../../features/importRequest/api/requestApi'
import type { ImportRequestCardWire, SupplierWire } from '../../features/importFeed/api/importApi'
import type {
  ReviewRightWire,
  ReviewWire,
  SellerWire,
} from '../../features/sellerProfile/api/sellerApi'

const HOURS = 3600_000
const DAYS = 24 * HOURS

export const CHATS: ChatWire[] = [
  {
    id: 'c1',
    counterparty_name: 'Дмитрий',
    listing_id: 'l1',
    listing_title: 'Lexus LX 570',
    listing_price: 4020000,
    last_message: 'А по документам всё чисто?',
    last_message_at: new Date(Date.now() - 2 * HOURS).toISOString(),
    unread_count: 0,
  },
  {
    id: 'c2',
    counterparty_name: 'Артём',
    listing_id: 'l1',
    listing_title: 'Lexus LX 570',
    listing_price: 4020000,
    last_message: 'Готов подъехать в субботу',
    last_message_at: new Date(Date.now() - 6 * HOURS).toISOString(),
    unread_count: 2,
  },
  {
    id: 'c3',
    counterparty_name: 'Ольга',
    listing_id: 'l4',
    listing_title: 'Mazda CX-5',
    listing_price: 1800000,
    last_message: 'Спасибо, договорились',
    last_message_at: new Date(Date.now() - 30 * HOURS).toISOString(),
    unread_count: 0,
  },
]

export const MESSAGES: MessageWire[] = [
  {
    id: 'm0',
    kind: 'system',
    body: 'Дмитрий предложил 3 850 000 ₽',
    created_at: new Date(Date.now() - 28 * HOURS).toISOString(),
    outgoing: false,
  },
  {
    id: 'm1',
    kind: 'text',
    body: 'Здравствуйте. Крыло переднее правое красили — что там было?',
    created_at: new Date(Date.now() - 27 * HOURS).toISOString(),
    outgoing: false,
  },
  {
    id: 'm2',
    kind: 'text',
    body: 'Парковочный контакт, задели столб. Лонжерон целый, красили только крыло — это видно в карте замеров.',
    created_at: new Date(Date.now() - 26 * HOURS).toISOString(),
    outgoing: true,
  },
  {
    id: 'm3',
    kind: 'text',
    body: 'Понял, спасибо. А по документам всё чисто?',
    created_at: new Date(Date.now() - 2 * HOURS).toISOString(),
    outgoing: false,
  },
]

export const SELLER: SellerWire = {
  id: 'u2',
  name: 'Михаил',
  rating: 4.8,
  deals_count: 12,
  reviews_count: 9,
  member_since: 'марта 2026',
}

export const SELLER_REVIEWS: ReviewWire[] = [
  {
    id: 'rv1',
    author_name: 'Ольга',
    rating: 5,
    created_at: new Date(Date.now() - 6 * DAYS).toISOString(),
    listing_title: 'Mazda CX-5',
    body: 'Машина полностью совпала с описанием, карта замеров оказалась честной — перекрас крыла был именно там, где показано.',
  },
  {
    id: 'rv2',
    author_name: 'Артём',
    rating: 4,
    created_at: new Date(Date.now() - 16 * DAYS).toISOString(),
    listing_title: 'Toyota Camry',
    body: 'Долго не отвечал в чате, но по сделке претензий нет. Документы в порядке.',
  },
]

export const REVIEW_RIGHT: ReviewRightWire = {
  can_review: true,
  deal_listing_title: 'Mazda CX-5',
  deal_closed_at: new Date(Date.now() - 6 * DAYS).toISOString(),
  existing_review_id: null,
}

export const SUPPLIERS: SupplierWire[] = [
  {
    id: 's1',
    name: 'Восток-Авто',
    rating: 4.7,
    deliveries_count: 18,
    countries: ['Япония', 'Корея'],
    brands: ['Toyota', 'Lexus', 'Honda'],
    delivery_days: '45–70 дней',
    prepayment_percent: 30,
  },
  {
    id: 's2',
    name: 'АвтоЛинк',
    rating: 4.9,
    deliveries_count: 31,
    countries: ['Корея', 'Китай'],
    brands: ['Kia', 'Hyundai', 'Chery'],
    delivery_days: '30–50 дней',
    prepayment_percent: 20,
  },
]

export function supplierProfile(id: string): SupplierProfileWire {
  const base = SUPPLIERS.find((item) => item.id === id) ?? SUPPLIERS[0]
  return {
    ...base,
    reviews_count: 18,
    member_since: 'июня 2026',
    approved: true,
    about:
      'Вожу с аукционов Японии пятый год. Под заказ беру конкретный лот с аукционного листа, растаможку веду сам.',
    listings: [],
  }
}

export const REQUEST_CARDS: ImportRequestCardWire[] = [
  {
    id: 'r1',
    title: 'Toyota Land Cruiser 300',
    years: '2022–2023',
    extra: 'до 60 000 км',
    budget_max: 12000000,
    responses_count: 4,
    created_at: new Date(Date.now() - 8 * DAYS).toISOString(),
  },
  {
    id: 'r2',
    title: 'Honda Vezel',
    years: '2019–2021',
    extra: 'гибрид',
    budget_max: 2400000,
    responses_count: 1,
    created_at: new Date(Date.now() - 1 * DAYS).toISOString(),
  },
]

export function importRequest(id: string): RequestWire {
  return {
    id,
    title: 'Toyota Land Cruiser 300',
    years: '2022–2023',
    budget_max: 12000000,
    mileage_max_km: 60000,
    countries: ['Япония', 'Корея', 'ОАЭ'],
    wait_days_max: 90,
    comment:
      'Нужна комплектация не ниже средней, желательно светлый салон. Важна прозрачная растаможка с документами.',
    created_at: new Date(Date.now() - 8 * DAYS).toISOString(),
    active: true,
    owned_by_me: true,
  }
}

export const BIDS: BidWire[] = [
  {
    id: 'b1',
    supplier_id: 's1',
    supplier_name: 'Восток-Авто',
    rating: 4.7,
    deliveries_count: 18,
    comment: 'Есть лот 2022 года, 42 000 км, аукцион 4.5B. Срок 65 дней, документы полные.',
    price: 11400000,
    delivery_days: 65,
  },
  {
    id: 'b2',
    supplier_id: 's3',
    supplier_name: 'Сергей К.',
    rating: 4.2,
    deliveries_count: 6,
    comment: 'Могу из ОАЭ, но комплектация будет базовая. Срок меньше.',
    price: 10900000,
    delivery_days: 40,
  },
  {
    id: 'b3',
    supplier_id: 's2',
    supplier_name: 'АвтоЛинк',
    rating: 4.9,
    deliveries_count: 31,
    comment: 'В бюджет не уложусь, но могу предложить 2021 год в максималке.',
    price: 12800000,
    delivery_days: 70,
  },
]
