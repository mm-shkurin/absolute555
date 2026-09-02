import { Link } from 'react-router-dom'
import { Button } from '../../../shared/ui/Button'
import { Placeholder } from '../../../shared/ui/Placeholder'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { ROUTES } from '../../../shared/navigation/routes'
import type { MyListingAction, MyListingRowView } from '../logic/myListingRows'
import styles from './MyListingRow.module.css'

export function MyListingList({
  rows,
  onAction,
}: {
  rows: MyListingRowView[]
  onAction: (action: MyListingAction['id'], row: MyListingRowView) => void
}) {
  return (
    <div className={styles.list} data-testid="my-listings">
      {rows.map((row) => (
        <div
          key={row.id}
          className={[styles.row, row.faded ? styles.faded : ''].filter(Boolean).join(' ')}
          data-testid="my-listing-row"
        >
          <Placeholder className={styles.cover}>обложка</Placeholder>
          <div>
            <Link to={ROUTES.listing(row.id)} className={styles.title}>
              {row.title}
            </Link>
            <div className={styles.meta}>{row.meta}</div>
          </div>
          <div className={styles.right}>
            <StatusBadge tone={row.tone}>{row.badge}</StatusBadge>
            {row.actions.map((action) => (
              <Button
                key={action.id}
                size="small"
                tone={action.primary ? 'solid' : 'ghost'}
                onClick={() => onAction(action.id, row)}
              >
                {action.label}
              </Button>
            ))}
          </div>
          {row.reason ? (
            <div className={styles.reason} data-testid="rejection-reason">
              <b>Причина от модератора:</b> {row.reason}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
