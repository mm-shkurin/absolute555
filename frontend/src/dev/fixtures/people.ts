import type { MyListingWire } from '../../features/myListings/api/myListingsApi'
import type { OffersWire } from '../../features/offers/api/offersApi'
import type { ProfileWire } from '../../features/profile/api/profileApi'

const HOURS = 3600_000
const DAYS = 24 * HOURS

export const PROFILE: ProfileWire = {
  id: 'u1',
  name: 'Михаил',
  avatar_url: null,
  rating: 4.8,
  deals_count: 12,
  reviews_count: 9,
  member_since: 'марта',
  listings_count: 6,
  rejected_listings: 1,
  incoming_offers: 3,
  outgoing_offers: 4,
  unread_messages: 2,
  supplier_status: 'pending',
  supplier_applied_at: new Date(Date.now() - 4 * DAYS).toISOString(),
  import_requests: [
    {
      id: 'r1',
      title: 'Toyota Land Cruiser 300, 2022–2023',
      budget_max: 12000000,
      created_at: new Date(Date.now() - 8 * DAYS).toISOString(),
      responses_count: 4,
      active: true,
    },
  ],
}

const baseListing: MyListingWire = {
  id: 'l1',
  title: 'Lexus LX 570',
  year: 2012,
  price: 4020000,
  mileage_km: 180000,
  status: 'published',
  photos_count: 7,
  measured_panels: 11,
  total_panels: 13,
  new_offers: 0,
  unread_messages: 0,
  draft_step: null,
  total_steps: null,
  updated_at: new Date().toISOString(),
  rejection_reason: null,
  sold_at: null,
  sold_price: null,
  buyer_name: null,
}

export const MY_LISTINGS: MyListingWire[] = [
  baseListing,
  {
    ...baseListing,
    id: 'l2',
    title: 'Toyota Camry',
    year: 2019,
    price: 2340000,
    new_offers: 3,
    unread_messages: 2,
  },
  {
    ...baseListing,
    id: 'l3',
    title: 'Honda Stream',
    year: 2010,
    price: 1020000,
    status: 'moderation',
    photos_count: 5,
    measured_panels: 0,
  },
  {
    ...baseListing,
    id: 'l4',
    title: 'Nissan Almera',
    year: 2014,
    price: 620000,
    status: 'rejected',
    rejection_reason:
      'на трёх фотографиях виден государственный номер и лицо человека. Замените снимки или закройте номер — после этого объявление пройдёт.',
  },
  {
    ...baseListing,
    id: 'l5',
    title: 'Kia Rio',
    year: 2018,
    price: null,
    status: 'draft',
    draft_step: 3,
    total_steps: 6,
    photos_count: 2,
  },
  {
    ...baseListing,
    id: 'l6',
    title: 'Mazda CX-5',
    year: 2016,
    price: 1800000,
    status: 'sold',
    sold_at: new Date(Date.now() - 6 * DAYS).toISOString(),
    sold_price: 1800000,
    buyer_name: 'Ольга',
  },
]

export function offers(direction: string): OffersWire {
  const incoming = direction !== 'outgoing'
  return {
    incoming_total: 3,
    outgoing_total: 4,
    items: incoming
      ? [
          offer('o1', 3850000, 'pending', 'Дмитрий', 2 * HOURS, 2 * DAYS),
          offer('o2', 3700000, 'pending', 'Артём', 5 * HOURS, 2 * DAYS),
          offer('o3', 900000, 'expired', 'Сергей', 7 * DAYS, null),
        ]
      : [
          offer('o4', 2200000, 'pending', 'Михаил', 26 * HOURS, 1 * DAYS),
          offer('o5', 1800000, 'accepted', 'Ольга', 6 * DAYS, null),
          offer('o6', 2100000, 'car_sold', 'Игорь', 8 * DAYS, null),
          offer('o7', 850000, 'withdrawn', 'Анна', 10 * DAYS, null),
        ],
  }
}

function offer(
  id: string,
  amount: number,
  status: OffersWire['items'][number]['status'],
  who: string,
  agoMs: number,
  expiresInMs: number | null,
): OffersWire['items'][number] {
  return {
    id,
    listing_id: 'l1',
    listing_title: 'Lexus LX 570',
    listing_year: 2012,
    listing_price: 4020000,
    photo_url: null,
    amount,
    status,
    created_at: new Date(Date.now() - agoMs).toISOString(),
    expires_at: expiresInMs === null ? null : new Date(Date.now() + expiresInMs).toISOString(),
    counterparty_name: who,
    counterparty_rating: 4.6,
    can_review: status === 'accepted',
    review_id: null,
  }
}
