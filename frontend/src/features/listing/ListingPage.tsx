// Карточка объявления. Три состояния смотрящего — гость, покупатель, продано — различаются
// только правой колонкой; левая одинакова, потому что машина от этого не меняется.
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { ROUTES } from '../../shared/navigation/routes'
import { ListingBody } from './components/ListingBody'
import { MobileActionBar, SidePanel, type SideHandlers } from './components/SidePanel'
import { OwnerPanel } from './components/OwnerPanel'
import { ListingFailure, ListingSkeleton } from './components/ListingStates'
import { ComplainSheet } from './components/ComplainSheet'
import { OfferSheet } from './components/OfferSheet'
import { useListingActions } from './useListingActions'
import { complain } from '../../shared/api/backend/moderationApi'
import type { ComplaintReason } from '../../shared/api/backend/moderationContract'
import { useListing } from './useListing'
import styles from './listing.module.css'

export function ListingPage({ signedIn, onSignIn }: { signedIn: boolean; onSignIn?: () => void }) {
  const navigate = useNavigate()
  const { listingId = '' } = useParams()
  const listing = useListing(listingId, signedIn, new Date())
  const [complaining, setComplaining] = useState(false)
  const actions = useListingActions(listingId)

  // Повторная жалоба и жалоба на своё объявление — ответ сервера, а не поломка экрана:
  // текст отказа показывается в шторке, и она остаётся открытой.
  const complaint = useMutation({
    mutationFn: ({ reason, text }: { reason: ComplaintReason; text: string }) =>
      complain(listingId, reason, text),
  })

  const handlers: SideHandlers = {
    onOffer: actions.openOffer,
    // Переписка начинается предложением цены: диалог заводит сервер, отдельной ручки
    // «написать продавцу» нет, и кнопка ведёт туда, где переписка появится.
    onMessage: () => navigate(ROUTES.chats),
    onShowPhone: actions.showPhone,
    onSignIn: () => onSignIn?.(),
    onComplain: () => {
      complaint.reset()
      setComplaining(true)
    },
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
              {listing.mode === 'owner' ? (
                <OwnerPanel
                  view={listing.view}
                  sold={listing.sold}
                  onEdit={() => navigate(ROUTES.selling)}
                  busy={actions.busy}
                  onUnpublish={() => actions.owner('withdraw')}
                  onMarkSold={() => actions.owner('sold')}
                  onSetting={() => undefined}
                />
              ) : (
                <SidePanel
                  view={listing.view}
                  mode={listing.mode}
                  offers={listing.offers}
                  phone={actions.phone}
                  handlers={handlers}
                />
              )}
            </div>
          ) : null}
        </Container>
      </main>
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
      {complaining ? (
        <ComplainSheet
          busy={complaint.isPending}
          failure={(complaint.error as Error | null)?.message ?? null}
          sent={complaint.isSuccess}
          onClose={() => setComplaining(false)}
          onSend={(reason, text) => complaint.mutate({ reason, text })}
        />
      ) : null}
    </>
  )
}
