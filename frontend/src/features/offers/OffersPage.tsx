// Офферы: две стороны одного торга. Входящие требуют решения, исходящие — ожидания, и это
// разные вкладки, а не один список с фильтром: действия у них не пересекаются.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageHeading, PageSection } from '../../shared/ui/PageHeading'
import { PillTabs } from '../../shared/ui/PillTabs'
import { EmptyNotice, FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { ROUTES } from '../../shared/navigation/routes'
import { OfferRow } from './components/OfferRow'
import { ReviewSheet } from './components/ReviewSheet'
import { useReview } from './useReview'
import type { OfferDirection } from './api/offersApi'
import type { OfferAction, OfferRowView } from './logic/offerRows'
import { useOffers } from './useOffers'
import styles from './offers.module.css'

export function OffersPage({ onSignIn }: { onSignIn?: () => void }) {
  const navigate = useNavigate()
  const [direction, setDirection] = useState<OfferDirection>('incoming')
  const offers = useOffers(direction, new Date())
  const review = useReview()

  const onAction = (action: OfferAction['id'], offer: OfferRowView) => {
    if (action === 'chat' || action === 'message') return navigate(ROUTES.chats)
    if (action === 'review')
      return review.open({ offerId: offer.id, reviewId: offer.reviewId })
    if (action === 'accept') return offers.decide('accept', offer.id)
    if (action === 'reject') return offers.decide('reject', offer.id)
    if (action === 'withdraw') return offers.decide('withdraw', offer.id)
  }

  return (
    <>
      <SiteHeader signedIn onSignIn={onSignIn} />
      <main data-testid="offers">
        <Container>
          <PageSection>
            <PageHeading
              title="Предложения по цене"
              sub="Оффер живёт трое суток. Не ответили — истекает сам."
            />
            <PillTabs
              current={direction}
              onSelect={setDirection}
              tabs={[
                { id: 'incoming', label: 'Мне прислали', count: offers.incomingTotal },
                { id: 'outgoing', label: 'Я отправил', count: offers.outgoingTotal },
              ]}
            />
            {offers.isLoading ? <ListSkeleton /> : null}
            {!offers.isLoading && offers.error ? (
              <FailureNotice message={offers.error.message} onRetry={offers.retry} />
            ) : null}
            {!offers.isLoading && !offers.error && offers.rows.length === 0 ? (
              <EmptyNotice
                title={direction === 'incoming' ? 'Предложений пока нет' : 'Вы ещё не торговались'}
              >
                {direction === 'incoming'
                  ? 'Как только покупатель предложит цену, оффер появится здесь.'
                  : 'Откройте объявление в ленте и предложите свою цену — торг идёт на площадке.'}
              </EmptyNotice>
            ) : null}
            {offers.rows.map((offer) => (
              <OfferRow key={offer.id} offer={offer} busy={offers.deciding} onAction={onAction} />
            ))}
            {direction === 'incoming' && offers.rows.length > 0 ? (
              <p className={styles.note}>
                Приняли предложение — объявление станет «продано», остальные офферы по нему
                отклонятся сами, их авторы увидят «машину продали».
              </p>
            ) : null}
          </PageSection>
        </Container>
      </main>
      {review.target ? (
        <ReviewSheet
          title={review.target.reviewId ? 'Изменить отзыв' : 'Отзыв о сделке'}
          initial={{ rating: null, text: '' }}
          busy={review.busy}
          failure={review.failure}
          editable={review.editable}
          onClose={review.close}
          onSend={review.send}
        />
      ) : null}
    </>
  )
}
