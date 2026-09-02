// Клиент карточки. Одна выдача на весь экран: характеристики, фотографии, продавец,
// предложения и сводка по замерам приходят вместе — четыре запроса на один экран означали
// бы четыре разных момента, когда карточка «наполовину загрузилась».
import { fetchOffersForCar } from '../../../shared/api/backend/offerApi'
import { fetchListing as fetchSaleCar } from '../../../shared/api/backend/saleCarApi'
import { currentSession } from '../../../shared/session/authSession'
import { toListingDetailWire } from '../logic/fromSaleCar'

export interface SellerWire {
  id: string
  name: string
  rating: number | null
  deals_count: number
}

export interface OfferWire {
  id: string
  amount: number
  created_at: string
}

export interface ListingDetailWire {
  id: string
  brand: string
  model: string
  year: number
  price: number
  mileage_km: number | null
  engine_power_hp: number | null
  transmission: string | null
  city: string | null
  vin_masked: string | null
  description: string | null
  photo_urls: string[]
  photos_total: number
  status: 'published' | 'sold'
  sold_at: string | null
  thickness_map_complete: boolean
  has_thickness_map: boolean
  phone_available: boolean
  chat_allowed: boolean
  // Своё объявление показывается тому же адресу, но другой колонкой: владельцу нужны
  // счётчики и управление, а не кнопка «предложить цену» самому себе.
  owned_by_me: boolean
  published_at: string | null
  views_count: number
  opens_count: number
  offers_count: number
  measured_panels: number
  total_panels: number
  seller: SellerWire
  offers: OfferWire[] | null
}

/** Предложения по машине сервер отдаёт только её владельцу, поэтому гость и покупатель
 *  за ними не ходят: отказ в правах — не то, чем должна кончаться загрузка карточки. */
export async function fetchListing(id: string, signal?: AbortSignal): Promise<ListingDetailWire> {
  const car = await fetchSaleCar(id, signal)
  const viewerId = currentSession()?.userId ?? null
  const owned = viewerId !== null && viewerId === car.user_id
  const offers = owned ? await fetchOffersForCar(id, signal) : null
  return toListingDetailWire(car, { viewerId, offers })
}
