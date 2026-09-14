import { Panel } from '../../../shared/ui/Panel'
import { Avatar, Rating } from '../../../shared/ui/Avatar'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import type { SupplierView } from '../logic/supplierView'
import styles from '../supplier.module.css'

interface SupplierSummaryProps {
  view: SupplierView
  coverUrl: string | null | undefined
}

export function SupplierSummary({ view, coverUrl }: SupplierSummaryProps) {
  return (
    <Panel first>
      <div className={styles.head}>
        {/* Фото витрины — квадратное, как фото профиля: лицо поставщика в
            том же круге, что у продавца, а не баннер. */}
        <Avatar size={64} url={coverUrl} />
        <div className={styles.headBody}>
          <div className={styles.name}>{view.name}</div>
          <Rating rating={view.rating}>{view.line}</Rating>
        </div>
        {/* Страница отдаётся только у опубликованного профиля: сервер
            отвечает на неопубликованный тем же 404, что и на чужой. */}
        <StatusBadge tone="ok">профиль проверен площадкой</StatusBadge>
      </div>
      <div className={styles.terms}>
        {view.terms.map((term) => (
          <div key={term.label}>
            <span>{term.label}</span>
            <b>{term.value}</b>
          </div>
        ))}
      </div>
      {view.about ? <p className={styles.about}>{view.about}</p> : null}
    </Panel>
  )
}
