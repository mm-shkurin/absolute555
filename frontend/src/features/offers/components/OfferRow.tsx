// Строка списка офферов. Действия зависят от состояния и стороны — их считает
// `logic/offerRows.ts`, здесь только кнопки по списку.
import { Link } from 'react-router-dom'
import { Button } from '../../../shared/ui/Button'
import { Placeholder } from '../../../shared/ui/Placeholder'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { ROUTES } from '../../../shared/navigation/routes'
import type { OfferAction, OfferRowView } from '../logic/offerRows'
import styles from './OfferRow.module.css'

export function OfferRow({
  offer,
  onAction,
}: {
  offer: OfferRowView
  onAction: (action: OfferAction['id'], offer: OfferRowView) => void
}) {
  return (
    <div
      className={[styles.row, offer.faded ? styles.faded : ''].filter(Boolean).join(' ')}
      data-testid="offer-row"
    >
      <Placeholder className={styles.photo}>фото</Placeholder>
      <div>
        <Link to={ROUTES.listing(offer.listingId)} className={styles.title}>
          {offer.title}
        </Link>
        <div className={styles.meta}>{offer.meta}</div>
        {offer.actions.length > 0 ? (
          <div className={styles.actions}>
            {offer.actions.map((action) => (
              <Button
                key={action.id}
                size="small"
                tone={action.primary ? 'solid' : 'ghost'}
                onClick={() => onAction(action.id, offer)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
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
}
