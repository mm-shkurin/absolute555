// Публичная страница продавца: кто он, что о нём написали и что продаёт сейчас. Три
// запроса, потому что три разные выдачи с разным сроком жизни — профиль меняется редко,
// объявления часто.
//
// Права оставить отзыв здесь нет и быть не может: оно живёт на сделке, а не на продавце,
// и приезжает в `can_review` своего оффера (история 12).
import { fetchSellerListings as fetchListingsPage } from '../../../shared/api/backend/reviewApi'
import { fromFeedCard } from '../../../shared/domain/listing/fromFeedCard'
import type { ListingWire } from '../../../shared/domain/listing/listingWire'

export async function fetchSellerListings(
  id: string,
  signal?: AbortSignal,
): Promise<{ items: ListingWire[]; total: number }> {
  const page = await fetchListingsPage(id, {}, signal)
  return { items: page.items.map(fromFeedCard), total: page.total }
}
