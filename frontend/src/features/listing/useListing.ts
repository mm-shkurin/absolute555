import { useQuery } from '@tanstack/react-query'
import { fetchListing } from './api/listingApi'
import {
  toListingDetailView,
  toOfferRows,
  viewerMode,
  type ListingDetailView,
  type OfferRow,
  type ViewerMode,
} from './logic/listingDetail'

export interface ListingResult {
  view: ListingDetailView | null
  mode: ViewerMode
  // Продано ли объявление — отдельно от режима: владелец видит свою колонку и после
  // продажи, но действия в ней уже не нужны.
  sold: boolean
  offers: OfferRow[] | null
  isLoading: boolean
  error: Error | null
  retry: () => void
}

export function useListing(id: string, signedIn: boolean, now: Date): ListingResult {
  const result = useQuery({
    queryKey: ['listing', id],
    queryFn: ({ signal }) => fetchListing(id, signal),
  })

  const wire = result.data ?? null
  return {
    view: wire ? toListingDetailView(wire) : null,
    mode: wire ? viewerMode(wire, signedIn) : 'guest',
    sold: wire?.status === 'sold',
    // `null` на проводе значит «закрыто до входа», пустой массив — «предложений ещё нет».
    // Разные вещи, и на экране они выглядят по-разному.
    offers: wire?.offers ? toOfferRows(wire.offers, now) : null,
    isLoading: result.isPending,
    error: (result.error as Error | null) ?? null,
    retry: () => void result.refetch(),
  }
}
