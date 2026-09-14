import { Button } from '../../../shared/ui/Button'
import { ReasonPicker } from '../../../shared/ui/ReasonPicker'
import { REJECTION_REASONS } from '../../../shared/format/moderationReasonLabels'
import type { RejectionLabel } from '../../../shared/api/backend/moderationContract'
import styles from '../moderation.module.css'

interface RejectionFormProps {
  label: RejectionLabel | null
  comment: string
  busy?: boolean
  onLabel: (label: RejectionLabel) => void
  onComment: (comment: string) => void
  onSubmit: () => void
  onCancel: () => void
}

export function RejectionForm(props: RejectionFormProps) {
  const { label, comment, busy } = props
  return (
    <div className={styles.rejection} data-testid="rejection-form">
      <div className={styles.label}>Причина отклонения — обязательна</div>
      <ReasonPicker
        options={REJECTION_REASONS}
        current={label}
        disabled={busy}
        onPick={props.onLabel}
      />
      <textarea
        className={styles.reason}
        value={comment}
        onChange={(event) => props.onComment(event.target.value)}
        placeholder="Что именно поправить. Текст увидит продавец."
      />
      <div className={styles.actions}>
        <Button block disabled={busy || label === null} onClick={props.onSubmit}>
          Отклонить и отправить причину
        </Button>
        <Button tone="ghost" block onClick={props.onCancel}>
          Отмена
        </Button>
      </div>
    </div>
  )
}
