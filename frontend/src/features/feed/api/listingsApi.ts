// Клиент ленты. Знает про один запрос и про форму, в которой сервер отдаёт объявление;
// перевод этой формы в то, что рисует карточка, — в `shared/domain/listing`.
import { API } from '../../../shared/api/endpoints'
import { send } from '../../../shared/api/send'
import type { ListingWire } from '../../../shared/domain/listing/listingWire'
import type { FeedQuery } from '../logic/feedQuery'
import { toSearchParams } from '../logic/feedQuery'

export type { ListingWire }

export interface FeedWire {
  items: ListingWire[]
  total: number
}

export async function fetchFeed(query: FeedQuery, signal?: AbortSignal): Promise<FeedWire> {
  const search = toSearchParams(query).toString()
  const path = search ? `${API.listings.collection}?${search}` : API.listings.collection
  return send<FeedWire>(path, { signal })
}
