import { Avatar, Rating } from '../../../shared/ui/Avatar'
import { ButtonLink } from '../../../shared/ui/Button'
import { ROUTES } from '../../../shared/navigation/routes'
import type { SupplierCardView } from '../logic/importView'
import styles from '../importFeed.module.css'

export function SupplierCard({ supplier }: { supplier: SupplierCardView }) {
  return (
    <div className={styles.card} data-testid="supplier-card">
      <div className={styles.supplierTop}>
        <Avatar size={48} />
        <div>
          <div className={styles.supplierName}>{supplier.name}</div>
          <Rating rating={supplier.rating}>{supplier.ratingLine}</Rating>
        </div>
      </div>
      <div className={styles.supplierBody}>
        {supplier.scope}
        <br />
        {supplier.terms}
      </div>
      <ButtonLink
        to={ROUTES.supplier(supplier.id)}
        tone="ghost"
        size="small"
        block
        className={styles.cardAction}
      >
        Открыть поставщика
      </ButtonLink>
    </div>
  )
}
