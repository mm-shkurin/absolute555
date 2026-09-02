// Направление «под заказ»: позиции поставщиков, сами поставщики и заявки покупателей.
// Три разные сущности в одной ленте, потому что покупателю они отвечают на один вопрос —
// как получить машину, которой в стране ещё нет.
import { API } from '../../../shared/api/endpoints'
import { send } from '../../../shared/api/send'
import type { ListingWire } from '../../../shared/domain/listing/listingWire'

export type ImportKind = 'cars' | 'suppliers' | 'requests'

export interface SupplierWire {
  id: string
  name: string
  rating: number | null
  deliveries_count: number
  countries: string[]
  brands: string[]
  delivery_days: string
  prepayment_percent: number
}

export interface ImportRequestCardWire {
  id: string
  title: string
  years: string
  extra: string | null
  budget_max: number | null
  responses_count: number
  created_at: string
}

export interface ImportFeedWire {
  cars: ListingWire[]
  suppliers: SupplierWire[]
  requests: ImportRequestCardWire[]
  cars_total: number
  suppliers_total: number
  requests_total: number
}

export async function fetchImportFeed(
  kind: ImportKind,
  signal?: AbortSignal,
): Promise<ImportFeedWire> {
  return send<ImportFeedWire>(`${API.listings.collection}?channel=import&kind=${kind}`, { signal })
}
