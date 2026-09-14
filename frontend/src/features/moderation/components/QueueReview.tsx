import type { UseMutationResult } from '@tanstack/react-query'
import { toReviewCard, type QueueRowView } from '../logic/queueView'
import type { QueueItemWire as QueueItem } from '../api/moderationApi'
import type { QueueDecision } from '../useQueueDecision'
import { QueueList } from './QueueList'
import { ReviewPanel } from './ReviewPanel'
import styles from '../moderation.module.css'

interface QueueReviewProps {
  rows: QueueRowView[]
  current: QueueItem | null
  readOnly: boolean
  decide: UseMutationResult<unknown, Error, QueueDecision>
  onSelect: (id: string) => void
}

export function QueueReview({ rows, current, readOnly, decide, onSelect }: QueueReviewProps) {
  return (
    <div className={styles.layout}>
      <QueueList rows={rows} current={current?.id ?? null} onSelect={onSelect} />
      {current ? (
        <ReviewPanel
          card={toReviewCard(current)}
          listingId={current.listing_id}
          busy={decide.isPending}
          readOnly={readOnly}
          onPublish={() => decide.mutate({ kind: 'publish', id: current.listing_id })}
          onReject={(label, comment) =>
            decide.mutate({ kind: 'reject', id: current.listing_id, label, comment })
          }
        />
      ) : null}
    </div>
  )
}
