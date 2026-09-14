import { Link } from 'react-router-dom'
import { IconTile } from '../../../shared/ui/Icon'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { ROUTES } from '../../../shared/navigation/routes'
import type { ImportRequestView } from '../logic/profileView'
import styles from '../profile.module.css'

interface RequestRowProps {
  request: ImportRequestView
}

export function RequestRow({ request }: RequestRowProps) {
  return (
    <div className={styles.request}>
      <IconTile name="document" className={styles.requestPhoto} />
      <div>
        <Link to={ROUTES.importRequest(request.id)} className={styles.requestTitle}>
          {request.title}
        </Link>
        <div className={styles.shortcutMeta}>{request.meta}</div>
      </div>
      <div className={styles.requestRight}>
        <div className={styles.responses}>{request.responses}</div>
        <div className={styles.badgeRow}>
          <StatusBadge tone={request.tone}>{request.badge}</StatusBadge>
        </div>
      </div>
    </div>
  )
}
