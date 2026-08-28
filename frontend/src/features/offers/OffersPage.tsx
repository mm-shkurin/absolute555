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
import type { OfferDirection } from './api/offersApi'
import type { OfferAction } from './logic/offerRows'
import { useOffers } from './useOffers'
import styles from './offers.module.css'

export function OffersPage({ onSignIn }: { onSignIn?: () => void }) {
  const navigate = useNavigate()
  const [direction, setDirection] = useState<OfferDirection>('incoming')
  const offers = useOffers(direction, new Date())

  // Принять, отклонить, отозвать и оставить отзыв — мутации; они появятся вместе с
  // подключением бэкенда. Переходы работают уже сейчас.
  const onAction = (action: OfferAction['id']) => {
    if (action === 'chat' || action === 'message') navigate(ROUTES.chats)
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
              <OfferRow key={offer.id} offer={offer} onAction={onAction} />
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
    </>
  )
}
