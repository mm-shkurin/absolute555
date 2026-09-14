import { StatusBadge } from '../../../shared/ui/StatusBadge'
import type { ListingDetailView } from '../logic/listingDetail'
import styles from './OwnerPanel.module.css'

interface OwnerHeadlineProps {
  view: ListingDetailView
  sold: boolean
}

export function OwnerHeadline({ view, sold }: OwnerHeadlineProps) {
  return (
    <>
      {sold ? (
        <StatusBadge tone="past">{`продано${view.soldOn ? ` ${view.soldOn}` : ''}`}</StatusBadge>
      ) : (
        <StatusBadge tone="ok">{`опубликовано${view.publishedOn ? ` ${view.publishedOn}` : ''}`}</StatusBadge>
      )}
      <div className={styles.title}>{view.title}</div>
      <div className={styles.price}>{view.price}</div>
      <div className={styles.summary}>{view.summary}</div>
      {view.decidedOn ? (
        <div className={styles.decided} data-testid="listing-decided">
          Проверено модератором {view.decidedOn}
          {view.decidedBy ? ` · ${view.decidedBy}` : ''}
        </div>
      ) : null}
      <div className={styles.stats}>
        {view.stats.map((stat) => (
          <div key={stat.label}>
            <b>{stat.value}</b>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </>
  )
}
