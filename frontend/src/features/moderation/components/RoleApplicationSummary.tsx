import { Avatar } from '../../../shared/ui/Avatar'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import type { RoleApplicationView } from '../logic/roleView'
import styles from '../roles.module.css'
import moderation from '../moderation.module.css'

interface RoleApplicationSummaryProps {
  application: RoleApplicationView
}

export function RoleApplicationSummary({ application }: RoleApplicationSummaryProps) {
  return (
    <>
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
      <RoleTerms application={application} />
    </>
  )
}

function RoleTerms({ application }: RoleApplicationSummaryProps) {
  return (
    <>
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
    </>
  )
}
