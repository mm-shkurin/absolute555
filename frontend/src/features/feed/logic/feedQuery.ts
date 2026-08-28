// Состояние фильтров и его перевод в параметры запроса. Чистые функции: ни fetch, ни React —
// то же состояние из адресной строки, из шторки на телефоне и из панели на десктопе даёт
// один и тот же запрос.
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

const SORT_PARAM: Record<FeedSort, string> = {
  newest: 'created_at:desc',
  'price-asc': 'price:asc',
  'price-desc': 'price:desc',
}

// Пустая строка в поле «от» и отсутствие фильтра — одно и то же для сервера, но разные
// параметры на проводе: `price_from=` сервер обязан разобрать, и разбирает по-разному.
function put(params: URLSearchParams, key: string, value?: string) {
  const trimmed = value?.trim()
  if (trimmed) params.set(key, trimmed)
}

export function toSearchParams(query: FeedQuery): URLSearchParams {
  const params = new URLSearchParams()
  params.set('kind', query.tab === 'import' ? 'import' : 'available')
  params.set('sort', SORT_PARAM[query.sort])
  put(params, 'brand', query.brand)
  put(params, 'year_from', query.yearFrom)
  put(params, 'year_to', query.yearTo)
  put(params, 'price_from', query.priceFrom)
  put(params, 'price_to', query.priceTo)
  put(params, 'mileage_from', query.mileageFrom)
  put(params, 'mileage_to', query.mileageTo)
  if (query.transmissions.length > 0) params.set('transmission', query.transmissions.join(','))
  if (query.withThicknessMap) params.set('thickness_map', 'true')
  return params
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
