import { memo } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../shared/ui/Button'
import { Cover } from '../../../shared/ui/Cover'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { ROUTES } from '../../../shared/navigation/routes'
import type { MyListingAction, MyListingRowView } from '../logic/myListingRows'
import styles from './MyListingRow.module.css'

type OnAction = (action: MyListingAction['id'], row: MyListingRowView) => void

interface MyListingListProps {
  rows: MyListingRowView[]
  onAction: OnAction
}

export function MyListingList({ rows, onAction }: MyListingListProps) {
  return (
    <div className={styles.list} data-testid="my-listings">
      {rows.map((row) => (
        <MyListingRow key={row.id} row={row} onAction={onAction} />
      ))}
    </div>
  )
}

interface MyListingRowProps {
  row: MyListingRowView
  onAction: OnAction
}

const MyListingRow = memo(function MyListingRow({ row, onAction }: MyListingRowProps) {
  return (
    <div
      className={[styles.row, row.faded ? styles.faded : ''].filter(Boolean).join(' ')}
      data-testid="my-listing-row"
    >
      <Cover className={styles.cover} url={row.coverUrl} caption="обложка" />
      <div>
        <Link to={ROUTES.listing(row.id)} className={styles.title}>
          {row.title}
        </Link>
        <div className={styles.meta}>{row.meta}</div>
      </div>
      <RowActions row={row} onAction={onAction} />
      {row.reason ? (
        <div className={styles.reason} data-testid="rejection-reason">
          <b>Причина от модератора:</b> {row.reason}
        </div>
      ) : null}
    </div>
  )
})

function RowActions({ row, onAction }: MyListingRowProps) {
  return (
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
  )
}
