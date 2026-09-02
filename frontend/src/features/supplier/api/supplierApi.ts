// Публичная страница поставщика: витрина (история 16), рейтинг с отзывами (12) и его
// позиции под привоз (17). Три запроса, потому что это три разные сущности сервера —
// отдельной сводной ручки под эту страницу нет.
import { fetchSupplierProfile } from '../../../shared/api/backend/supplierApi'
import {
  fetchSellerListings,
  fetchSellerProfile,
  fetchSellerReviews,
} from '../../../shared/api/backend/reviewApi'
import { fromFeedCard } from '../../../shared/domain/listing/fromFeedCard'
import type { ListingWire } from '../../../shared/domain/listing/listingWire'
import type { SupplierProfileWire } from '../../../shared/api/backend/supplierContract'
import type { SellerProfileWire, ReviewWire } from '../../../shared/api/backend/reviewContract'

export interface SupplierPageWire {
  profile: SupplierProfileWire
  seller: SellerProfileWire
  listings: ListingWire[]
}

export async function fetchSupplier(
  userId: string,
  signal?: AbortSignal,
): Promise<SupplierPageWire> {
  const [profile, seller, listings] = await Promise.all([
    fetchSupplierProfile(userId, signal),
    fetchSellerProfile(userId, signal),
    fetchSellerListings(userId, {}, signal),
  ])
  return { profile, seller, listings: listings.items.map(fromFeedCard) }
}

export async function fetchSupplierReviews(
  userId: string,
  signal?: AbortSignal,
): Promise<{ items: ReviewWire[] }> {
  const page = await fetchSellerReviews(userId, {}, signal)
  return { items: page.items }
}
