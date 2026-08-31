// Клиент ленты. Ходит на `GET /sale_car/list` — единственную выдачу объявлений, которую
// сервер отдаёт сегодня, — и переводит её в форму карточки.
//
// Отбор и сортировка делаются здесь же, на полученном списке: параметров отбора у сервера
// нет. Как только они появятся, `applyQuery` уходит, а `toSearchParams` начинает
// подставляться в путь.
import { fetchPublished } from '../../../shared/api/backend/saleCarApi'
import { toListingWire } from '../../../shared/domain/listing/fromSaleCar'
import type { ListingWire } from '../../../shared/domain/listing/listingWire'
import type { FeedQuery } from '../logic/feedQuery'
import { applyQuery } from '../logic/filterListings'

export type { ListingWire }

export interface FeedWire {
  items: ListingWire[]
  total: number
}

export async function fetchFeed(query: FeedQuery, signal?: AbortSignal): Promise<FeedWire> {
  const cars = await fetchPublished(undefined, signal)
  const items = applyQuery(cars.map(toListingWire), query)
  // Общее число — это число найденного, а не всего в базе: страниц у выдачи пока нет,
  // и обещать «248 объявлений» при двадцати показанных было бы неправдой.
  return { items, total: items.length }
}
