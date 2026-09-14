import type { ComplaintSheetState } from '../useComplaintSheet'
import type { ListingActions } from '../useListingActions'
import type { ListingResult } from '../useListing'
import { ComplainSheet } from './ComplainSheet'
import { OfferSheet } from './OfferSheet'
import { MobileActionBar, type SideHandlers } from './SidePanel'

interface ListingOverlaysProps {
  listing: ListingResult
  actions: ListingActions
  complaint: ComplaintSheetState
  handlers: SideHandlers
}

export function ListingOverlays({ listing, actions, complaint, handlers }: ListingOverlaysProps) {
  return (
    <>
      {listing.view && listing.mode !== 'owner' ? (
        <MobileActionBar mode={listing.mode} handlers={handlers} />
      ) : null}
      {actions.offering && listing.view ? (
        <OfferSheet
          askingPrice={listing.view.price}
          busy={actions.busy}
          failure={actions.failure}
          sent={actions.offerSent}
          onClose={actions.closeOffer}
          onSend={actions.sendOffer}
        />
      ) : null}
      {complaint.isOpen ? (
        <ComplainSheet
          busy={complaint.busy}
          failure={complaint.failure}
          sent={complaint.sent}
          onClose={complaint.close}
          onSend={complaint.send}
        />
      ) : null}
    </>
  )
}
