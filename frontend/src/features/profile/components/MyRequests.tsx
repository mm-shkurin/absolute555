// Свои заявки на привоз. Отклик — главное число строки: заявка без откликов ничем не
// отличается от заявки, о которой забыли, кроме этого счётчика.
import { Link } from 'react-router-dom'
import { Panel } from '../../../shared/ui/Panel'
import { Placeholder } from '../../../shared/ui/Placeholder'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { ButtonLink } from '../../../shared/ui/Button'
import { ROUTES } from '../../../shared/navigation/routes'
import type { ImportRequestView } from '../logic/profileView'
import styles from '../profile.module.css'

export function MyRequests({ requests }: { requests: ImportRequestView[] }) {
  return (
    <Panel
      title="Мои заявки на привоз"
      aside={
        <ButtonLink to={ROUTES.newImportRequest} tone="ghost" size="small">
          Новая заявка
        </ButtonLink>
      }
      testId="my-requests"
    >
      {requests.length === 0 ? (
        <p>Не нашли нужную машину в ленте — опишите её заявкой, и поставщики откликнутся сами.</p>
      ) : null}
      {requests.map((request) => (
        <div key={request.id} className={styles.request}>
          <Placeholder className={styles.requestPhoto}>заявка</Placeholder>
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
      ))}
    </Panel>
  )
}
