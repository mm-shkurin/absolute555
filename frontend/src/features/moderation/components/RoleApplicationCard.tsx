// Карточка заявки на роль. Отказ требует текста: заявитель должен понять, что исправить,
// иначе он подаст ту же заявку заново.
import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Panel } from '../../../shared/ui/Panel'
import { Avatar } from '../../../shared/ui/Avatar'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import type { RoleApplicationView } from '../logic/roleView'
import styles from '../roles.module.css'
import moderation from '../moderation.module.css'

export function RoleApplicationCard({
  application,
  first,
  onApprove,
  onReject,
}: {
  application: RoleApplicationView
  first?: boolean
  onApprove: () => void
  onReject: (reason: string) => void
}) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')

  return (
    <Panel first={first} testId="role-application">
      <div className={styles.head}>
        <Avatar size={56} />
        <div className={styles.headBody}>
          <div className={styles.name}>{application.name}</div>
          <div className={styles.meta}>{application.meta}</div>
        </div>
        {application.fresh ? (
          <StatusBadge tone="bad">свежий аккаунт</StatusBadge>
        ) : (
          <StatusBadge tone="wait">на рассмотрении</StatusBadge>
        )}
      </div>

      <div className={styles.terms}>
        {application.terms.map((term) => (
          <div key={term.label}>
            <span>{term.label}</span>
            <b className={term.mono ? moderation.mono : undefined}>{term.value}</b>
          </div>
        ))}
      </div>

      {application.about ? (
        <div className={styles.about}>
          <div className={moderation.label}>О себе</div>
          <p>{application.about}</p>
        </div>
      ) : null}

      <div className={styles.actions}>
        <Button onClick={onApprove}>Одобрить и выдать роль</Button>
        <Button tone="ghost" onClick={() => setRejecting((value) => !value)}>
          Отклонить с причиной
        </Button>
      </div>

      {rejecting ? (
        <div className={styles.rejection} data-testid="role-rejection">
          <textarea
            className={moderation.reason}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Причина. Текст увидит заявитель."
          />
          <div className={styles.actions}>
            <Button disabled={reason.trim().length === 0} onClick={() => onReject(reason)}>
              Отправить отказ
            </Button>
            <Button tone="ghost" onClick={() => setRejecting(false)}>
              Отмена
            </Button>
          </div>
        </div>
      ) : null}
    </Panel>
  )
}
