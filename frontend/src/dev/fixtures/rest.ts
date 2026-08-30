import type { ChatWire, MessageWire } from '../../features/chats/api/chatsApi'
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
