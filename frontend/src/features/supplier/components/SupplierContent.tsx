import { Panel } from '../../../shared/ui/Panel'
import { ListingGrid } from '../../../shared/ui/listingCard/ListingCard'
import { toListingView } from '../../../shared/domain/listing/listingView'
import type { fetchSupplier, fetchSupplierReviews } from '../api/supplierApi'
import type { SupplierView } from '../logic/supplierView'
import { SupplierSide } from './SupplierSide'
import { SupplierSummary } from './SupplierSummary'
import { SupplierReviews } from './SupplierReviews'
import styles from '../supplier.module.css'

interface SupplierContentProps {
  view: SupplierView
  data: Awaited<ReturnType<typeof fetchSupplier>>
  reviews: Awaited<ReturnType<typeof fetchSupplierReviews>> | undefined
}

export function SupplierContent({ view, data, reviews }: SupplierContentProps) {
  return (
    <div className={styles.layout}>
      <div>
        <SupplierSummary view={view} coverUrl={data.profile.cover_url} />
        <Panel title={view.listingsTitle} testId="supplier-listings">
          {data.listings.length === 0 ? (
            <p>Сейчас у поставщика нет опубликованных позиций.</p>
          ) : (
            <ListingGrid listings={data.listings.map(toListingView)} columns={3} />
          )}
        </Panel>
        <SupplierReviews title={view.reviewsTitle} reviews={reviews?.items ?? []} />
      </div>
      <SupplierSide supplier={view} />
    </div>
  )
}
