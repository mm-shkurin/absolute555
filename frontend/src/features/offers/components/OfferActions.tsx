import { Button } from '../../../shared/ui/Button'
import type { OfferAction, OfferRowView } from '../logic/offerRows'
import styles from './OfferRow.module.css'

interface OfferActionsProps {
  offer: OfferRowView
  busy?: boolean
  onAction: (action: OfferAction['id'], offerId: string) => void
}

export function OfferActions({ offer, busy, onAction }: OfferActionsProps) {
  if (offer.actions.length === 0) return null
  return (
    <div className={styles.actions}>
      {offer.actions.map((action) => (
        <Button
          key={action.id}
          size="small"
          tone={action.primary ? 'solid' : 'ghost'}
          disabled={busy}
          onClick={() => onAction(action.id, offer.id)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  )
}
