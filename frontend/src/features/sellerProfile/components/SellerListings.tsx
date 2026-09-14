import { Panel } from '../../../shared/ui/Panel'
import { ListingGrid } from '../../../shared/ui/listingCard/ListingCard'
import { toListingView } from '../../../shared/ui/listingCard/listingView'
import type { useSellerQueries } from '../useSellerQueries'

interface SellerListingsProps {
  listings: ReturnType<typeof useSellerQueries>['listings']['data']
}

export function SellerListings({ listings }: SellerListingsProps) {
  const items = listings?.items ?? []
  return (
    <Panel title={`Активные объявления · ${listings?.total ?? items.length}`}>
      {items.length === 0 ? (
        <p>Сейчас у продавца нет опубликованных объявлений.</p>
      ) : (
        <ListingGrid listings={items.map(toListingView)} columns={3} />
      )}
    </Panel>
  )
}
