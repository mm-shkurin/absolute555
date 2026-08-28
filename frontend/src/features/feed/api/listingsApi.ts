// Клиент ленты. Знает про один запрос и про форму, в которой сервер отдаёт объявление;
// перевод этой формы в то, что рисует карточка, — в `logic/listingView.ts`.
import { API } from '../../../shared/api/endpoints'
import { send } from '../../../shared/api/send'
import type { FeedQuery } from '../logic/feedQuery'
import { toSearchParams } from '../logic/feedQuery'

// Змеиный регистр — это провод, а не наш код: так отдаёт FastAPI, и переименование здесь
// скрыло бы расхождение с контрактом до первого запроса в проде.
export interface ListingWire {
  id: string
  brand: string
  model: string
  year: number
  price: number
  mileage_km: number | null
  engine_power_hp: number | null
  transmission: string | null
  city: string | null
  photo_url: string | null
  has_thickness_map: boolean
  vin_verified: boolean
  import_delivery_days: string | null
}

export interface FeedWire {
  items: ListingWire[]
  total: number
}

export async function fetchFeed(query: FeedQuery, signal?: AbortSignal): Promise<FeedWire> {
  const search = toSearchParams(query).toString()
  const path = search ? `${API.listings.collection}?${search}` : API.listings.collection
  return send<FeedWire>(path, { signal })
}
