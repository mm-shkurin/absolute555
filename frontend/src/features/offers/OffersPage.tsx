// Офферы: две стороны одного торга. Входящие требуют решения, исходящие — ожидания, и это
// разные вкладки, а не один список с фильтром: действия у них не пересекаются.
import { useState } from 'react'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageHeading, PageSection } from '../../shared/ui/PageHeading'
import { PillTabs } from '../../shared/ui/PillTabs'
import { ReviewSheetFor } from '../../shared/review/ReviewSheetFor'
import { useReview } from '../../shared/review/useReview'
import type { OfferDirection } from './api/offersApi'
import { OffersList } from './components/OffersList'
import { useOfferActions } from './useOfferActions'
import { useOffers } from './useOffers'

export function OffersPage({ onSignIn }: { onSignIn?: () => void }) {
  const [direction, setDirection] = useState<OfferDirection>('incoming')
  const offers = useOffers(direction, new Date())
  const review = useReview()
  const onAction = useOfferActions(offers, review)
  const tabs = [
    { id: 'incoming' as const, label: 'Мне прислали', count: offers.incomingTotal },
    { id: 'outgoing' as const, label: 'Я отправил', count: offers.outgoingTotal },
  ]

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
            <PillTabs current={direction} onSelect={setDirection} tabs={tabs} />
            <OffersList direction={direction} offers={offers} onAction={onAction} />
          </PageSection>
        </Container>
      </main>
      <ReviewSheetFor review={review} newTitle="Отзыв о сделке" />
    </>
  )
}
