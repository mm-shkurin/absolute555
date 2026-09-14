// Карточка заявки на роль. Отказ требует текста: заявитель должен понять, что исправить,
// иначе он подаст ту же заявку заново.
import { memo, useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Panel } from '../../../shared/ui/Panel'
import type { RoleRequestDecision } from '../../../shared/api/backend/accountContract'
import type { RoleApplicationView } from '../logic/roleView'
import { RoleApplicationSummary } from './RoleApplicationSummary'
import styles from '../roles.module.css'
import moderation from '../moderation.module.css'

interface RoleApplicationCardProps {
  application: RoleApplicationView
  first?: boolean
  busy?: boolean
  onAnswer: (id: string, decision: RoleRequestDecision) => void
}

export const RoleApplicationCard = memo(function RoleApplicationCard(
  props: RoleApplicationCardProps,
) {
  const { application, busy, onAnswer } = props
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const reject = () => onAnswer(application.id, { status: 'rejected', review_comment: reason })

  return (
    <Panel first={props.first} testId="role-application">
      <RoleApplicationSummary application={application} />
      {/* Разобранную заявку решать нечем: сервер отвечает на второе решение отказом. */}
      <div className={styles.actions} hidden={application.answered}>
        <Button disabled={busy} onClick={() => onAnswer(application.id, { status: 'approved' })}>
          Одобрить и выдать роль
        </Button>
        <Button tone="ghost" disabled={busy} onClick={() => setRejecting((value) => !value)}>
          Отклонить с причиной
        </Button>
      </div>
      {rejecting && !application.answered ? (
        <RoleRejection
          reason={reason}
          busy={busy}
          onReason={setReason}
          onSubmit={reject}
          onCancel={() => setRejecting(false)}
        />
      ) : null}
    </Panel>
  )
})

interface RoleRejectionProps {
  reason: string
  busy?: boolean
  onReason: (reason: string) => void
  onSubmit: () => void
  onCancel: () => void
}

function RoleRejection({ reason, busy, onReason, onSubmit, onCancel }: RoleRejectionProps) {
  return (
    <div className={styles.rejection} data-testid="role-rejection">
      <textarea
        className={moderation.reason}
        value={reason}
        onChange={(event) => onReason(event.target.value)}
        placeholder="Причина. Текст увидит заявитель."
      />
      <div className={styles.actions}>
        <Button disabled={busy || reason.trim().length === 0} onClick={onSubmit}>
          Отправить отказ
        </Button>
        <Button tone="ghost" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </div>
  )
}
