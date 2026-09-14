import type { ListingDetailView } from '../logic/listingDetail'
import type { ListingActions } from '../useListingActions'
import type { ListingResult } from '../useListing'
import { ListingBody } from './ListingBody'
import { OwnerColumn } from './OwnerColumn'
import { SidePanel, type SideHandlers } from './SidePanel'
import styles from '../listing.module.css'

interface ListingColumnsProps {
  view: ListingDetailView
  listing: ListingResult
  actions: ListingActions
  handlers: SideHandlers
}

export function ListingColumns({ view, listing, actions, handlers }: ListingColumnsProps) {
  const owner = listing.mode === 'owner'
  return (
    <div className={styles.layout}>
      <ListingBody listing={view} onComplain={owner ? undefined : handlers.onComplain} />
      {owner ? (
        <OwnerColumn view={view} sold={listing.sold} actions={actions} />
      ) : (
        <SidePanel
          view={view}
          mode={listing.mode}
          offers={listing.offers}
          phone={actions.phone}
          handlers={handlers}
        />
      )}
    </div>
  )
}
