// Свои объявления во всех состояниях сразу: черновики, модерация, публикация, отказ,
// продажа. Одним запросом — вкладки на экране только фильтруют уже полученное, поэтому
// переключение мгновенное и не гоняет сеть.
import { API } from '../../../shared/api/endpoints'
import { send } from '../../../shared/api/send'

export type ListingStatus = 'draft' | 'moderation' | 'published' | 'rejected' | 'sold'

export interface MyListingWire {
  id: string
  title: string
  year: number
  price: number | null
  mileage_km: number | null
  status: ListingStatus
  photos_count: number
  measured_panels: number
  total_panels: number
  new_offers: number
  unread_messages: number
  draft_step: number | null
  total_steps: number | null
  updated_at: string
  rejection_reason: string | null
  sold_at: string | null
  sold_price: number | null
  buyer_name: string | null
}

export async function fetchMyListings(signal?: AbortSignal): Promise<{ items: MyListingWire[] }> {
  return send<{ items: MyListingWire[] }>(`${API.listings.collection}?owner=me`, { signal })
}
