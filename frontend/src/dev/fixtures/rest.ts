import type { ChatWire, MessageWire } from '../../features/chats/api/chatsApi'
import type {
  ReviewWire,
  SellerProfileWire,
} from '../../shared/api/backend/reviewContract'

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
    read_at: null,
  },
  {
    id: 'm1',
    kind: 'text',
    body: 'Здравствуйте. Крыло переднее правое красили — что там было?',
    created_at: new Date(Date.now() - 27 * HOURS).toISOString(),
    outgoing: false,
    read_at: null,
  },
  {
    id: 'm2',
    kind: 'text',
    body: 'Парковочный контакт, задели столб. Лонжерон целый, красили только крыло — это видно в карте замеров.',
    created_at: new Date(Date.now() - 26 * HOURS).toISOString(),
    outgoing: true,
    read_at: null,
  },
  {
    id: 'm3',
    kind: 'text',
    body: 'Понял, спасибо. А по документам всё чисто?',
    created_at: new Date(Date.now() - 2 * HOURS).toISOString(),
    outgoing: false,
    read_at: null,
  },
]

export const SELLER: SellerProfileWire = {
  user_id: 'u2',
  name: 'Михаил',
  avatar_url: null,
  rating: 4.8,
  reviews_count: 9,
  deals_count: 12,
  listings_count: 2,
  member_since: new Date(2026, 2, 14).toISOString(),
}

export const SELLER_REVIEWS: ReviewWire[] = [
  {
    review_id: 'rv1',
    offer_id: 'o1',
    sale_car_id: 'l1',
    seller_id: 'u2',
    author: { user_id: 'u7', name: 'Ольга', avatar_url: null },
    rating: 5,
    text: 'Машина полностью совпала с описанием, карта замеров оказалась честной — перекрас крыла был именно там, где показано.',
    created_at: new Date(Date.now() - 6 * DAYS).toISOString(),
    updated_at: null,
    editable_until: null,
  },
  {
    review_id: 'rv2',
    offer_id: 'o2',
    sale_car_id: 'l2',
    seller_id: 'u2',
    author: { user_id: 'u8', name: 'Артём', avatar_url: null },
    rating: 4,
    text: 'Долго не отвечал в чате, но по сделке претензий нет. Документы в порядке.',
    created_at: new Date(Date.now() - 16 * DAYS).toISOString(),
    updated_at: null,
    editable_until: null,
  },
]
