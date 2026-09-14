// Правая колонка страницы поставщика: как начать и как это устроено. Порядок расчётов
// назван прямо — площадка денег не держит, и человек должен понять это до переписки,
// а не после предоплаты.
import type { SupplierView } from '../logic/supplierView'
import { HowItWorks } from './HowItWorks'
import { OrderPanel } from './OrderPanel'
import styles from '../supplier.module.css'

interface SupplierSideProps {
  supplier: SupplierView
}

export function SupplierSide({ supplier }: SupplierSideProps) {
  const prepayment = supplier.terms.find((term) => term.label === 'Предоплата')?.value ?? ''
  return (
    <aside className={styles.side}>
      <OrderPanel supplierId={supplier.id} />
      <HowItWorks prepayment={prepayment} />
    </aside>
  )
}
