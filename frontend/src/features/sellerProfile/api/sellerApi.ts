// Публичная страница продавца: кто он, что о нём написали и что продаёт сейчас. Три
// запроса, потому что три разные выдачи с разным сроком жизни — профиль меняется редко,
// объявления часто.
import { API } from '../../../shared/api/endpoints'
import { send } from '../../../shared/api/send'
import type { ListingWire } from '../../../shared/domain/listing/listingWire'

export interface SellerWire {
  id: string
  name: string
  rating: number | null
  deals_count: number
  reviews_count: number
  member_since: string
}

export interface ReviewWire {
  id: string
  author_name: string
  rating: number
  created_at: string
  listing_title: string
  body: string
}

// Право на отзыв даёт только принятое предложение. Сервер отдаёт его вместе со сделкой,
// по которой оно возникло: без неё форма не смогла бы объяснить, за что оценка.
export interface ReviewRightWire {
  can_review: boolean
  deal_listing_title: string | null
  deal_closed_at: string | null
  existing_review_id: string | null
}

export async function fetchSeller(id: string, signal?: AbortSignal): Promise<SellerWire> {
  return send<SellerWire>(API.users.profile(id), { signal })
}

export async function fetchSellerReviews(
  id: string,
  signal?: AbortSignal,
): Promise<{ items: ReviewWire[]; right: ReviewRightWire }> {
  return send<{ items: ReviewWire[]; right: ReviewRightWire }>(API.reviews.ofSeller(id), { signal })
}

export async function fetchSellerListings(
  id: string,
  signal?: AbortSignal,
): Promise<{ items: ListingWire[] }> {
  return send<{ items: ListingWire[] }>(API.users.listings(id), { signal })
}
