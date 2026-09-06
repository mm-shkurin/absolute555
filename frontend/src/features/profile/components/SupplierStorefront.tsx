// Витрина поставщика в своём профиле: заполнена ли, где она и что с ней делать дальше.
//
// Одобрение заявки выдаёт роль — и на этом человек оставался без единой подсказки: он
// ждал появления в ленте того, чего не создавал. Витрина заполняется отдельно и проходит
// свою проверку, и об этом должно быть сказано там, где заканчивается заявка.
import { ButtonLink } from '../../../shared/ui/Button'
import { Panel } from '../../../shared/ui/Panel'
import { StatusBadge, type StatusTone } from '../../../shared/ui/StatusBadge'
import { ROUTES } from '../../../shared/navigation/routes'
import type { SupplierStatus } from '../../../shared/api/backend/supplierContract'
import styles from '../profile.module.css'

interface Step {
  badge: string | null
  tone: StatusTone
  note: string
  action: string
}

const STEPS: Record<SupplierStatus, Step> = {
  draft: {
    badge: 'черновик',
    tone: 'wait',
    note: 'Витрина не отправлена на проверку — покупатели её пока не видят.',
    action: 'Продолжить и отправить',
  },
  pending: {
    badge: 'на проверке',
    tone: 'wait',
    note: 'Модератор смотрит витрину. Пока она на проверке, править её нельзя.',
    action: 'Посмотреть витрину',
  },
  published: {
    badge: 'опубликована',
    tone: 'ok',
    note: 'Витрина видна покупателям на вкладке «Под заказ».',
    action: 'Открыть витрину',
  },
  rejected: {
    badge: 'вернули',
    tone: 'bad',
    note: 'Модератор вернул витрину. Исправьте и отправьте снова.',
    action: 'Исправить и отправить',
  },
}

export function SupplierStorefront({
  status,
  rejectReason,
}: {
  /** `null` — витрины нет вовсе: человек получил роль и ещё ничего не заполнял. */
  status: SupplierStatus | null
  rejectReason: string | null
}) {
  const step = status ? STEPS[status] : null

  return (
    <Panel title="Ваша витрина" testId="supplier-storefront">
      <div className={styles.supplierRow}>
        {step?.badge ? <StatusBadge tone={step.tone}>{step.badge}</StatusBadge> : null}
        <ButtonLink to={ROUTES.supplierProfile} size="small">
          {step?.action ?? 'Заполнить витрину'}
        </ButtonLink>
      </div>
      <p className={styles.storefrontNote}>
        {step?.note ?? 'Витрина не заполнена — покупатели вас не найдут. Роль у вас уже есть.'}
      </p>
      {status === 'rejected' && rejectReason ? (
        <p className={styles.storefrontReason} data-testid="storefront-reason">
          Причина: {rejectReason}
        </p>
      ) : null}
    </Panel>
  )
}
