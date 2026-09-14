// Профиль поставщика в очереди: то, что модератор читает, и два решения по нему.
import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { TextInput } from '../../../shared/ui/Form'
import { Avatar } from '../../../shared/ui/Avatar'
import type { SupplierProfileWire } from '../../../shared/api/backend/supplierContract'
import styles from '../roles.module.css'

interface SupplierProfileCardProps {
  profile: SupplierProfileWire
  busy: boolean
  onApprove: () => void
  onReject: (reason: string) => void
}

export function SupplierProfileCard({
  profile,
  busy,
  onApprove,
  onReject,
}: SupplierProfileCardProps) {
  return (
    <div className={styles.card} data-testid="supplier-queue-card" data-user={profile.user_id}>
      <SupplierProfileSummary profile={profile} />
      <div className={styles.actions}>
        <Button onClick={onApprove} disabled={busy} data-testid="supplier-approve">
          Опубликовать
        </Button>
        <SupplierReject busy={busy} onReject={onReject} />
      </div>
    </div>
  )
}

function SupplierReject({ busy, onReject }: Pick<SupplierProfileCardProps, 'busy' | 'onReject'>) {
  const [reason, setReason] = useState('')

  return (
    <>
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
    </>
  )
}

function SupplierProfileSummary({ profile }: { profile: SupplierProfileWire }) {
  const days =
    profile.delivery_days_min === null || profile.delivery_days_max === null
      ? 'срок не указан'
      : `${profile.delivery_days_min}–${profile.delivery_days_max} дней`
  const countries = profile.countries.join(', ') || 'страны не указаны'
  const brands = profile.brands.join(', ') || 'любые марки'

  return (
    <>
      {/* Фото витрины модератор видит тем же кругом, что увидят покупатели. */}
      <div className={styles.cardHead}>
        <Avatar size={56} url={profile.cover_url} />
        <h3>{profile.company_name ?? 'Без названия'}</h3>
      </div>
      <p className={styles.meta}>
        {countries} · {brands} · {days}
      </p>
      {profile.terms ? <p>{profile.terms}</p> : null}
      {profile.description ? <p className={styles.meta}>{profile.description}</p> : null}
    </>
  )
}
