import { FailureNotice, ListSkeleton } from '../../../shared/ui/ListStates'
import type { OfferDirection } from '../api/offersApi'
import type { OfferActionHandler } from '../useOfferActions'
import type { OffersResult } from '../useOffers'
import { OfferRow } from './OfferRow'
import { OffersEmpty } from './OffersEmpty'
import styles from '../offers.module.css'

interface OffersListProps {
  direction: OfferDirection
  offers: OffersResult
  onAction: OfferActionHandler
}

export function OffersList({ direction, offers, onAction }: OffersListProps) {
  const settled = !offers.isLoading
  return (
    <>
      {offers.isLoading ? <ListSkeleton /> : null}
      {settled && offers.error ? (
        <FailureNotice message={offers.error.message} onRetry={offers.retry} />
      ) : null}
      {settled && !offers.error && offers.rows.length === 0 ? (
        <OffersEmpty direction={direction} />
      ) : null}
      {offers.rows.map((offer) => (
        <OfferRow key={offer.id} offer={offer} busy={offers.deciding} onAction={onAction} />
      ))}
      {direction === 'incoming' && offers.rows.length > 0 ? (
        <p className={styles.note}>
          Приняли предложение — объявление станет «продано», остальные офферы по нему отклонятся
          сами, их авторы увидят «машину продали».
        </p>
      ) : null}
    </>
  )
}
