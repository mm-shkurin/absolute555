// Офферы обеих сторон одним запросом с параметром направления: экран переключает вкладку
// мгновенно, а два разных пути к одному списку разошлись бы в форме ответа.
import { API } from '../../../shared/api/endpoints'
import { send } from '../../../shared/api/send'

export type OfferDirection = 'incoming' | 'outgoing'

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired' | 'sold'

export interface OfferListItemWire {
  id: string
  listing_id: string
  listing_title: string
  listing_year: number
  listing_price: number
  photo_url: string | null
  amount: number
  status: OfferStatus
  created_at: string
  expires_at: string | null
  counterparty_name: string
  counterparty_rating: number | null
}

export interface OffersWire {
  items: OfferListItemWire[]
  incoming_total: number
  outgoing_total: number
}

export async function fetchOffers(
  direction: OfferDirection,
  signal?: AbortSignal,
): Promise<OffersWire> {
  return send<OffersWire>(`${API.offers.collection}?direction=${direction}`, { signal })
}
