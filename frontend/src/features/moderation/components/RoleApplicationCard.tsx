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
  busy,
  onApprove,
  onReject,
}: {
  application: RoleApplicationView
  first?: boolean
  busy?: boolean
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
        <StatusBadge tone={application.answered ? 'info' : 'wait'}>
          {application.answered ? 'решение принято' : 'на рассмотрении'}
        </StatusBadge>
      </div>

      <div className={styles.terms}>
        <div>
          <span>Роль</span>
          <b>{application.role}</b>
        </div>
        <div>
          <span>Зачем</span>
          <b>{application.reason}</b>
        </div>
      </div>

      {application.about ? (
        <div className={styles.about}>
          <div className={moderation.label}>Что добавил от себя</div>
          <p>{application.about}</p>
        </div>
      ) : null}

      {/* Разобранную заявку решать нечем: сервер отвечает на второе решение отказом. */}
      <div className={styles.actions} hidden={application.answered}>
        <Button disabled={busy} onClick={onApprove}>
          Одобрить и выдать роль
        </Button>
        <Button tone="ghost" disabled={busy} onClick={() => setRejecting((value) => !value)}>
          Отклонить с причиной
        </Button>
      </div>

      {rejecting && !application.answered ? (
        <div className={styles.rejection} data-testid="role-rejection">
          <textarea
            className={moderation.reason}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Причина. Текст увидит заявитель."
          />
          <div className={styles.actions}>
            <Button
              disabled={busy || reason.trim().length === 0}
              onClick={() => onReject(reason)}
            >
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
