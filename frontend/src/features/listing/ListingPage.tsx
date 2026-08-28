// Карточка объявления. Три состояния смотрящего — гость, покупатель, продано — различаются
// только правой колонкой; левая одинакова, потому что машина от этого не меняется.
import { Link, useParams } from 'react-router-dom'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { ROUTES } from '../../shared/navigation/routes'
import { ListingBody } from './components/ListingBody'
import { MobileActionBar, SidePanel, type SideHandlers } from './components/SidePanel'
import { ListingFailure, ListingSkeleton } from './components/ListingStates'
import { useListing } from './useListing'
import styles from './listing.module.css'

export function ListingPage({ signedIn, onSignIn }: { signedIn: boolean; onSignIn?: () => void }) {
  const { listingId = '' } = useParams()
  const listing = useListing(listingId, signedIn, new Date())

  const handlers: SideHandlers = {
    onOffer: () => undefined,
    onMessage: () => undefined,
    onShowPhone: () => undefined,
    onSignIn: () => onSignIn?.(),
    onComplain: () => undefined,
  }

  return (
    <>
      <SiteHeader signedIn={signedIn} onSignIn={onSignIn} />
      <main data-testid="listing">
        <Container>
          <div className={styles.crumbs}>
            <Link to={ROUTES.feed}>Лента</Link>
            {listing.view ? ` › ${listing.view.title}` : null}
          </div>
          {listing.isLoading ? <ListingSkeleton /> : null}
          {!listing.isLoading && listing.error ? (
            <ListingFailure message={listing.error.message} onRetry={listing.retry} />
          ) : null}
          {listing.view ? (
            <div className={styles.layout}>
              <ListingBody listing={listing.view} />
              <SidePanel
                view={listing.view}
                mode={listing.mode}
                offers={listing.offers}
                handlers={handlers}
              />
            </div>
          ) : null}
        </Container>
      </main>
      {listing.view ? <MobileActionBar mode={listing.mode} handlers={handlers} /> : null}
    </>
  )
}
