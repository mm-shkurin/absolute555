import { Placeholder } from '../../../shared/ui/Placeholder'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import type { QueueRowView } from '../logic/queueView'
import styles from '../moderation.module.css'

export function QueueList({
  rows,
  current,
  onSelect,
}: {
  rows: QueueRowView[]
  current: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div data-testid="queue-list">
      {rows.map((row) => (
        <button
          key={row.id}
          type="button"
          className={[styles.item, row.id === current ? styles.current : ''].join(' ')}
          onClick={() => onSelect(row.id)}
        >
          <Placeholder className={styles.cover}>обложка</Placeholder>
          <span>
            <span className={styles.itemTitle}>{row.title}</span>
            <span className={styles.itemMeta}>{row.meta}</span>
            {row.flag ? <span className={styles.flag}>{row.flag}</span> : null}
          </span>
          <StatusBadge tone={row.tone}>{row.badge}</StatusBadge>
        </button>
      ))}
    </div>
  )
}
