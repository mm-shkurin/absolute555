// Клиент ленты. Ходит по контракту истории 7 (`api-specs/sale_car_feed.yaml`): страница,
// точный счётчик, фильтры и сортировка — всё на стороне сервера.
import { fetchFeed as fetchFeedPage } from '../../../shared/api/backend/saleCarApi'
import { fromFeedCard } from '../../../shared/domain/listing/fromFeedCard'
import type { ListingWire } from '../../../shared/domain/listing/listingWire'
import { toFeedFilters, type FeedQuery } from '../logic/feedQuery'

export type { ListingWire }

export interface FeedWire {
  items: ListingWire[]
  total: number
}

export async function fetchFeed(query: FeedQuery, signal?: AbortSignal): Promise<FeedWire> {
  const page = await fetchFeedPage(toFeedFilters(query), signal)
  return { items: page.items.map(fromFeedCard), total: page.total }
}
