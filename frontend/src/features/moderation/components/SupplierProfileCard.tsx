// Профиль поставщика в очереди: то, что модератор читает, и два решения по нему.
import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { TextInput } from '../../../shared/ui/Form'
import type { SupplierProfileWire } from '../../../shared/api/backend/supplierContract'
import styles from '../roles.module.css'

interface Props {
  profile: SupplierProfileWire
  busy: boolean
  onApprove: () => void
  onReject: (reason: string) => void
}

export function SupplierProfileCard({ profile, busy, onApprove, onReject }: Props) {
  const [reason, setReason] = useState('')
  const days =
    profile.delivery_days_min === null || profile.delivery_days_max === null
      ? 'срок не указан'
      : `${profile.delivery_days_min}–${profile.delivery_days_max} дней`

  return (
    <div className={styles.card} data-testid="supplier-queue-card" data-user={profile.user_id}>
      <h3>{profile.company_name ?? 'Без названия'}</h3>
      <p className={styles.meta}>
        {profile.countries.join(', ') || 'страны не указаны'} · {profile.brands.join(', ') || 'любые марки'} · {days}
      </p>
      {profile.terms ? <p>{profile.terms}</p> : null}
      {profile.description ? <p className={styles.meta}>{profile.description}</p> : null}
      <div className={styles.actions}>
        <Button onClick={onApprove} disabled={busy} data-testid="supplier-approve">
          Опубликовать
        </Button>
        <TextInput
          value={reason}
          onChange={setReason}
          placeholder="причина отказа"
          testId="supplier-reason"
        />
        {/* Отказ без причины сервер отвергает: заявитель должен понять, что исправить.
            Кнопка выключена заранее, чтобы отказ не стоил лишнего круга по сети. */}
        <Button
          tone="ghost"
          onClick={() => onReject(reason)}
          disabled={busy || reason.trim() === ''}
          data-testid="supplier-reject"
        >
          Отклонить
        </Button>
      </div>
    </div>
  )
}
