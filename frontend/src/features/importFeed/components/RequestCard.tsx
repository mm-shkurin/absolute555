// Заявка покупателя — обратный аукцион: не он ищет машину, а поставщики находят его.
import { ButtonLink } from '../../../shared/ui/Button'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { ROUTES } from '../../../shared/navigation/routes'
import type { RequestCardView } from '../logic/importView'
import styles from '../importFeed.module.css'

export function RequestCard({ request }: { request: RequestCardView }) {
  return (
    <div className={styles.card} data-testid="request-card">
      <StatusBadge tone="info">заявка покупателя</StatusBadge>
      <div className={styles.requestTitle}>{request.title}</div>
      <div className={styles.requestSpec}>{request.spec}</div>
      <div className={styles.requestBudget}>{request.budget}</div>
      <div className={styles.requestMeta}>{request.meta}</div>
      <ButtonLink
        to={ROUTES.importRequest(request.id)}
        size="small"
        block
        className={styles.cardAction}
      >
        Откликнуться
      </ButtonLink>
    </div>
  )
}
