// Карточка объявления. Три состояния смотрящего — гость, покупатель, продано — различаются
// только правой колонкой; левая одинакова, потому что машина от этого не меняется.
import { Link, useParams } from 'react-router-dom'
import { PageShell } from '../../shared/ui/PageShell'
import { ROUTES } from '../../shared/navigation/routes'
import { ListingColumns } from './components/ListingColumns'
import { ListingOverlays } from './components/ListingOverlays'
import { ListingFailure, ListingSkeleton } from './components/ListingStates'
import { useComplaintSheet } from './useComplaintSheet'
import { useListingActions } from './useListingActions'
import { useListing } from './useListing'
import { useSideHandlers } from './useSideHandlers'
import styles from './listing.module.css'

interface ListingPageProps {
  signedIn: boolean
  onSignIn?: () => void
}

export function ListingPage({ signedIn, onSignIn }: ListingPageProps) {
  const { listingId = '' } = useParams()
  const listing = useListing(listingId, signedIn, new Date())
  const actions = useListingActions(listingId)
  const complaint = useComplaintSheet(listingId)
  const handlers = useSideHandlers(actions, complaint.open, onSignIn)
  const crumbs = (
    <>
      <Link to={ROUTES.feed}>Лента</Link>
      {listing.view ? ` › ${listing.view.title}` : null}
    </>
  )
  const overlays = <ListingOverlays {...{ listing, actions, complaint, handlers }} />

  return (
    <PageShell
      {...{ signedIn, onSignIn, crumbs }}
      testId="listing"
      crumbsClassName={styles.crumbs}
      outside={overlays}
    >
      {listing.isLoading ? <ListingSkeleton /> : null}
      {!listing.isLoading && listing.error ? (
        <ListingFailure message={listing.error.message} onRetry={listing.retry} />
      ) : null}
      {listing.view ? (
        <ListingColumns view={listing.view} {...{ listing, actions, handlers }} />
      ) : null}
    </PageShell>
  )
}
