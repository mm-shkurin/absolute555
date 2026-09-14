// Строка списка офферов. Действия зависят от состояния и стороны — их считает
// `logic/offerRows.ts`, здесь только кнопки по списку.
import { memo } from 'react'
import { Link } from 'react-router-dom'
import { Cover } from '../../../shared/ui/Cover'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { ROUTES } from '../../../shared/navigation/routes'
import type { OfferAction, OfferRowView } from '../logic/offerRows'
import { OfferActions } from './OfferActions'
import styles from './OfferRow.module.css'

interface OfferRowProps {
  offer: OfferRowView
  busy?: boolean
  onAction: (action: OfferAction['id'], offerId: string) => void
}

export const OfferRow = memo(function OfferRow({ offer, busy, onAction }: OfferRowProps) {
  return (
    <div
      className={[styles.row, offer.faded ? styles.faded : ''].filter(Boolean).join(' ')}
      data-testid="offer-row"
    >
      <Cover className={styles.photo} url={offer.photoUrl} caption="фото" />
      <div>
        <Link to={ROUTES.listing(offer.listingId)} className={styles.title}>
          {offer.title}
        </Link>
        <div className={styles.meta}>{offer.meta}</div>
        <OfferActions offer={offer} busy={busy} onAction={onAction} />
      </div>
      <div className={styles.right}>
        <div className={styles.amount}>{offer.amount}</div>
        {offer.gap ? <div className={styles.meta}>{offer.gap}</div> : null}
        <div className={styles.badgeRow}>
          <StatusBadge tone={offer.tone}>{offer.badge}</StatusBadge>
        </div>
      </div>
    </div>
  )
})
