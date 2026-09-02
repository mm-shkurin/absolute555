// Заявка на роль поставщика. Приглашение и состояние заявки в одном блоке: пока заявки
// нет, человеку нужно объяснение, а как только она подана — только её судьба.
import { Button, ButtonLink } from '../../../shared/ui/Button'
import { Panel } from '../../../shared/ui/Panel'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { ROUTES } from '../../../shared/navigation/routes'
import type { SupplierStateView } from '../logic/profileView'
import styles from '../profile.module.css'

export function SupplierApplication({
  state,
  onApply,
}: {
  state: SupplierStateView
  onApply: () => void
}) {
  return (
    <Panel title="Заявка на роль поставщика" testId="supplier-application">
      <p>
        Если вы возите машины из-за рубежа — подайте заявку. Одобренный поставщик получает публичную
        страницу и публикует позиции под привоз сам.
      </p>
      <div className={styles.supplierRow}>
        {state.badge ? <StatusBadge tone={state.tone}>{state.badge}</StatusBadge> : null}
        {state.invitation ? (
          <Button size="small" onClick={onApply}>
            Подать заявку
          </Button>
        ) : (
          <Button size="small" tone="ghost" onClick={onApply}>
            Посмотреть заявку
          </Button>
        )}
        <ButtonLink to={ROUTES.importFeed} tone="ghost" size="small">
          Пример страницы поставщика
        </ButtonLink>
      </div>
    </Panel>
  )
}
