// Состояние фильтров и его перевод в параметры запроса. Чистые функции: ни fetch, ни React —
// то же состояние из адресной строки, из шторки на телефоне и из панели на десктопе даёт
// один и тот же запрос.
import type { FeedFilters, FeedSort as BackendSort } from '../../../shared/api/backend/feedContract'

export type FeedTab = 'available' | 'import'
export type FeedSort = 'newest' | 'price-asc' | 'price-desc'

export interface FeedQuery {
  tab: FeedTab
  sort: FeedSort
  brand?: string
  yearFrom?: string
  yearTo?: string
  priceFrom?: string
  priceTo?: string
  mileageFrom?: string
  mileageTo?: string
  transmissions: string[]
  withThicknessMap: boolean
}

export const EMPTY_QUERY: FeedQuery = {
  tab: 'available',
  sort: 'newest',
  transmissions: [],
  withThicknessMap: false,
}

// Имена сортировок — из `api-specs/sale_car_feed.yaml`, а не свои: сервер принимает
// ровно эти три значения.
const SORT_PARAM: Record<FeedSort, BackendSort> = {
  newest: 'newest',
  'price-asc': 'price_asc',
  'price-desc': 'price_desc',
}

const numeric = (value?: string): number | undefined => {
  const parsed = Number(value?.trim())
  return value?.trim() && Number.isFinite(parsed) ? parsed : undefined
}

/** Перевод состояния фильтров в параметры ленты. Двух фильтров экрана сервер не знает:
 *  вкладка «под заказ» ждёт истории 17, «с картой замеров» — истории 14, и параметров под
 *  них в контракте нет. Отправлять их наугад значит получить отказ на весь запрос. */
export function toFeedFilters(query: FeedQuery, page = 1): FeedFilters {
  return {
    brand_id: query.brand?.trim() || undefined,
    year_from: numeric(query.yearFrom),
    year_to: numeric(query.yearTo),
    price_from: numeric(query.priceFrom),
    price_to: numeric(query.priceTo),
    mileage_from: numeric(query.mileageFrom),
    mileage_to: numeric(query.mileageTo),
    transmission: query.transmissions.length > 0 ? query.transmissions : undefined,
    sort: SORT_PARAM[query.sort],
    page,
  }
}

export function toggleTransmission(query: FeedQuery, value: string): FeedQuery {
  const present = query.transmissions.includes(value)
  return {
    ...query,
    transmissions: present
      ? query.transmissions.filter((item) => item !== value)
      : [...query.transmissions, value],
  }
}

export function isFiltered(query: FeedQuery): boolean {
  const { tab, sort, transmissions, withThicknessMap, ...ranges } = query
  void tab
  void sort
  return (
    transmissions.length > 0 ||
    withThicknessMap ||
    Object.values(ranges).some((value) => Boolean(value?.trim()))
  )
}
