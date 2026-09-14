import { vi } from 'vitest'
import { ListingPage } from '../ListingPage'
import { BACKEND } from '../../../shared/api/backend/paths'
import { renderPage } from '../../../test/renderPage'
import { signedIn, type FakeServer } from '../../../test/fakeServer'

// Копия `GET /sale_car/{id}` опубликованного объявления.
export const car = (over: Record<string, unknown> = {}) => ({
  sale_car_id: 'car1',
  user_id: 'seller',
  vin: 'XW8ZZZ61ZJG012345',
  brand: 'Lexus',
  model: 'GS',
  mark_raw: null,
  model_raw: null,
  year: 2012,
  transmission: 'АКПП',
  engine_power: 249,
  phone_number: null,
  price: 1900000,
  milleage: 96400,
  description: 'Один владелец',
  status: 'published',
  published_at: '2026-09-01T10:00:00',
  updated_at: '2026-09-01T10:00:00',
  photos: [],
  phone_visible: true,
  chat_allowed: true,
  offers_visible: false,
  moderation: null,
  autofill: null,
  seller: { user_id: 'seller', name: 'Дмитрий', avatar_url: null, rating: 4.8, deals_count: 3 },
  thickness: null,
  listing_kind: 'stock',
  import_country: null,
  delivery_days: null,
  turnkey_price: null,
  ...over,
})

export function listingOpener(server: () => FakeServer) {
  return (
    over: Record<string, unknown> = {},
    viewer: string | null = 'buyer',
    onSignIn = vi.fn(),
  ) => {
    if (viewer) signedIn(viewer)
    server().on('GET', BACKEND.saleCar.one('car1'), { status: 200, body: car(over) })
    renderPage(<ListingPage signedIn={viewer !== null} onSignIn={onSignIn} />, {
      at: '/l/car1',
      route: '/l/:listingId',
    })
    return onSignIn
  }
}
