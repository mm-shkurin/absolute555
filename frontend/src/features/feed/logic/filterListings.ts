// Фильтрация и сортировка ленты на клиенте.
//
// Временная мера, и это единственная причина, по которой она здесь: сервер отдаёт
// `GET /sale_car/list` без единого параметра отбора. Когда фильтры появятся на сервере,
// весь этот файл удаляется, а `toSearchParams` начинает работать по назначению —
// см. `ProductSpecification/api-specs/backend-contract-map.md`.
import type { ListingWire } from '../../../shared/domain/listing/listingWire'
import type { FeedQuery, FeedSort } from './feedQuery'

const number = (value?: string): number | null => {
  const parsed = Number(value?.trim())
  return value?.trim() && Number.isFinite(parsed) ? parsed : null
}

function inRange(value: number | null, from?: string, to?: string): boolean {
  const low = number(from)
  const high = number(to)
  // Объявление без пробега не отсеивается диапазоном пробега: неизвестное значение — это
  // не «ноль» и не «слишком много», и прятать такую машину значит соврать о выдаче.
  if (value === null) return low === null && high === null
  if (low !== null && value < low) return false
  return !(high !== null && value > high)
}

function matches(listing: ListingWire, query: FeedQuery): boolean {
  if (query.tab === 'import') return listing.import_delivery_days !== null
  if (query.brand && listing.brand.toLowerCase() !== query.brand.toLowerCase()) return false
  if (!inRange(listing.year, query.yearFrom, query.yearTo)) return false
  if (!inRange(listing.price, query.priceFrom, query.priceTo)) return false
  if (!inRange(listing.mileage_km, query.mileageFrom, query.mileageTo)) return false
  if (query.transmissions.length > 0) {
    if (!listing.transmission) return false
    if (!query.transmissions.includes(listing.transmission)) return false
  }
  return !(query.withThicknessMap && !listing.has_thickness_map)
}

const ORDER: Record<FeedSort, (a: ListingWire, b: ListingWire) => number> = {
  // Сервер отдаёт список уже отсортированным по времени создания, поэтому «сначала новые»
  // ничего не переставляет: любая своя сортировка здесь разошлась бы с серверной.
  newest: () => 0,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
}

export function applyQuery(listings: ListingWire[], query: FeedQuery): ListingWire[] {
  return listings.filter((listing) => matches(listing, query)).toSorted(ORDER[query.sort])
}
