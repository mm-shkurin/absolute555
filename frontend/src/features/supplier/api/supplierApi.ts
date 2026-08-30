// Публичная страница поставщика: условия работы, его позиции и отзывы о поставках.
import { API } from '../../../shared/api/endpoints'
import { send } from '../../../shared/api/send'
import type { ListingWire } from '../../../shared/domain/listing/listingWire'

export interface SupplierProfileWire {
  id: string
  name: string
  rating: number | null
  deliveries_count: number
  reviews_count: number
  member_since: string
  approved: boolean
  countries: string[]
  brands: string[]
  delivery_days: string
  prepayment_percent: number
  about: string | null
  listings: ListingWire[]
}

export interface SupplierReviewWire {
  id: string
  author_name: string
  rating: number
  body: string
}

export async function fetchSupplier(
  id: string,
  signal?: AbortSignal,
): Promise<SupplierProfileWire> {
  return send<SupplierProfileWire>(API.importing.supplier(id), { signal })
}

export async function fetchSupplierReviews(
  id: string,
  signal?: AbortSignal,
): Promise<{ items: SupplierReviewWire[] }> {
  return send<{ items: SupplierReviewWire[] }>(API.reviews.ofSeller(id), { signal })
}
