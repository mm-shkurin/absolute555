import { memo } from 'react'
import { Cover } from '../../../shared/ui/Cover'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import type { QueueRowView } from '../logic/queueView'
import styles from '../moderation.module.css'

interface QueueListProps {
  rows: QueueRowView[]
  current: string | null
  onSelect: (id: string) => void
}

export function QueueList({ rows, current, onSelect }: QueueListProps) {
  return (
    <div data-testid="queue-list">
      {rows.map((row) => (
        <QueueRow key={row.id} row={row} isCurrent={row.id === current} onSelect={onSelect} />
      ))}
    </div>
  )
}

interface QueueRowProps {
  row: QueueRowView
  isCurrent: boolean
  onSelect: (id: string) => void
}

const QueueRow = memo(function QueueRow({ row, isCurrent, onSelect }: QueueRowProps) {
  return (
    <button
      type="button"
      data-testid="queue-row"
      className={[styles.item, isCurrent ? styles.current : ''].join(' ')}
      onClick={() => onSelect(row.id)}
    >
      <Cover className={styles.cover} url={row.coverUrl} caption="обложка" />
      <span>
        <span className={styles.itemTitle}>{row.title}</span>
        <span className={styles.itemMeta}>{row.meta}</span>
        {row.flag ? <span className={styles.flag}>{row.flag}</span> : null}
      </span>
      <StatusBadge tone={row.tone}>{row.badge}</StatusBadge>
    </button>
  )
})
