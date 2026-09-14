import { Button, ButtonLink } from '../../../shared/ui/Button'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import { ROUTES } from '../../../shared/navigation/routes'
import type { SupplierStateView } from '../logic/profileView'
import styles from '../profile.module.css'

interface SupplierApplicationActionsProps {
  state: SupplierStateView
  onApply: () => void
}

export function SupplierApplicationActions({ state, onApply }: SupplierApplicationActionsProps) {
  return (
    <div className={styles.supplierRow}>
      {state.badge ? <StatusBadge tone={state.tone}>{state.badge}</StatusBadge> : null}
      <Button size="small" tone={state.invitation ? undefined : 'ghost'} onClick={onApply}>
        {state.invitation ? 'Подать заявку' : 'Посмотреть заявку'}
      </Button>
      {/* Профиль заводится после одобрения роли: до него заполнять нечего, и ссылка
          туда обещала бы витрину тому, у кого нет права её публиковать. */}
      {state.approved ? (
        <ButtonLink to={ROUTES.supplierProfile} size="small" data-testid="open-supplier-profile">
          Профиль поставщика
        </ButtonLink>
      ) : (
        <ButtonLink to={ROUTES.importFeed} tone="ghost" size="small">
          Пример страницы поставщика
        </ButtonLink>
      )}
    </div>
  )
}
