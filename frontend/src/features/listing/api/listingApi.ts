// Клиент карточки. Одна выдача на весь экран: характеристики, фотографии, продавец,
// предложения и сводка по замерам приходят вместе — четыре запроса на один экран означали
// бы четыре разных момента, когда карточка «наполовину загрузилась».
import { API } from '../../../shared/api/endpoints'
import { send } from '../../../shared/api/send'

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

export async function fetchListing(id: string, signal?: AbortSignal): Promise<ListingDetailWire> {
  return send<ListingDetailWire>(API.listings.one(id), { signal })
}
