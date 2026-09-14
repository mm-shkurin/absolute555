import { memo } from 'react'
import { Panel } from '../../../shared/ui/Panel'
import { Avatar } from '../../../shared/ui/Avatar'
import { Button, ButtonLink } from '../../../shared/ui/Button'
import { Cover } from '../../../shared/ui/Cover'
import { ReasonPicker } from '../../../shared/ui/ReasonPicker'
import { REJECTION_REASONS } from '../../../shared/domain/moderationReasons'
import { ROUTES } from '../../../shared/navigation/routes'
import type { RejectionLabel } from '../../../shared/api/backend/moderationContract'
import type { toComplaintCase } from '../logic/complaintView'
import styles from '../complaints.module.css'

type ComplaintCaseView = ReturnType<typeof toComplaintCase>

interface ComplaintCaseProps {
  item: ComplaintCaseView
  first: boolean
  busy: boolean
  unpublishing: boolean
  onToggle: (listingId: string) => void
  onUnpublish: (listingId: string, label: RejectionLabel) => void
  onDismiss: (complaintIds: string[]) => void
}

export const ComplaintCase = memo(function ComplaintCase(props: ComplaintCaseProps) {
  const { item, busy } = props
  return (
    <Panel first={props.first} testId="complaint-case">
      <CaseHead item={item} />
      <ComplaintEntries complaints={item.complaints} />
      <div className={styles.actions}>
        <ButtonLink to={ROUTES.listing(item.listingId)}>Открыть карточку</ButtonLink>
        <Button tone="ghost" disabled={busy} onClick={() => props.onToggle(item.listingId)}>
          Снять с публикации
        </Button>
        <Button
          tone="ghost"
          disabled={busy}
          onClick={() => props.onDismiss(item.complaints.map((one) => one.id))}
        >
          Отклонить жалобы
        </Button>
      </div>
      {props.unpublishing ? (
        <UnpublishReasons
          busy={busy}
          onPick={(label) => props.onUnpublish(item.listingId, label)}
        />
      ) : null}
    </Panel>
  )
})

function CaseHead({ item }: { item: ComplaintCaseView }) {
  return (
    <div className={styles.head}>
      <Cover className={styles.cover} url={item.coverUrl} caption="обложка" />
      <div className={styles.headBody}>
        <div className={styles.title}>{item.title}</div>
        <div className={styles.seller}>{item.seller}</div>
      </div>
      <span className={styles.flag}>{item.count}</span>
    </div>
  )
}

function ComplaintEntries({ complaints }: { complaints: ComplaintCaseView['complaints'] }) {
  return (
    <div className={styles.complaints}>
      {complaints.map((complaint) => (
        <div key={complaint.id} className={styles.complaint}>
          <Avatar size={36} url={complaint.authorAvatar} />
          <div>
            <div className={styles.author}>
              {complaint.author} <span>{complaint.meta}</span>
            </div>
            <p className={styles.body}>{complaint.body}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

interface UnpublishReasonsProps {
  busy: boolean
  onPick: (label: RejectionLabel) => void
}

function UnpublishReasons({ busy, onPick }: UnpublishReasonsProps) {
  return (
    <div className={styles.reasons} data-testid="unpublish-reasons">
      <div className={styles.reasonsLabel}>За что снимаем — увидит продавец</div>
      <ReasonPicker options={REJECTION_REASONS} current={null} disabled={busy} onPick={onPick} />
    </div>
  )
}
