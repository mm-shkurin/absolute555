// Публичная страница продавца: кто он, что о нём написали и что продаёт сейчас. Три
// запроса, потому что три разные выдачи с разным сроком жизни — профиль меняется редко,
// объявления часто.
//
// Права оставить отзыв здесь нет и быть не может: оно живёт на сделке, а не на продавце,
// и приезжает в `can_review` своего оффера (история 12).
import {
  fetchSellerListings as fetchListingsPage,
  fetchSellerProfile,
  fetchSellerReviews as fetchReviewsPage,
} from '../../../shared/api/backend/reviewApi'
import type {
  ReviewWire,
  SellerProfileWire,
} from '../../../shared/api/backend/reviewContract'
import { fromFeedCard } from '../../../shared/domain/listing/fromFeedCard'
import type { ListingWire } from '../../../shared/domain/listing/listingWire'

export type { ReviewWire, SellerProfileWire }

export function fetchSeller(id: string, signal?: AbortSignal): Promise<SellerProfileWire> {
  return fetchSellerProfile(id, signal)
}

export async function fetchSellerReviews(
  id: string,
  signal?: AbortSignal,
): Promise<{ items: ReviewWire[]; total: number }> {
  const page = await fetchReviewsPage(id, {}, signal)
  return { items: page.items, total: page.total }
}

export async function fetchSellerListings(
  id: string,
  signal?: AbortSignal,
): Promise<{ items: ListingWire[]; total: number }> {
  const page = await fetchListingsPage(id, {}, signal)
  return { items: page.items.map(fromFeedCard), total: page.total }
}
