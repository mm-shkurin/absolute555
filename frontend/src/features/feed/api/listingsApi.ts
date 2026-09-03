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
  page: number
  size: number
}

export async function fetchFeed(
  query: FeedQuery,
  page = 1,
  signal?: AbortSignal,
): Promise<FeedWire> {
  const wire = await fetchFeedPage(toFeedFilters(query, page), signal)
  return {
    items: wire.items.map(fromFeedCard),
    total: wire.total,
    page: wire.page,
    size: wire.size,
  }
}

/** Есть ли что грузить дальше. Считается по счётчику сервера, а не по «пришла полная
 *  страница»: полная последняя страница выглядела бы как непоследняя, и кнопка «Показать
 *  ещё» приводила бы к пустоте. */
export function hasMorePages(loaded: number, total: number): boolean {
  return loaded < total
}
