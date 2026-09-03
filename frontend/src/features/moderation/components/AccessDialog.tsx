// Причина, без которой доступ не закрывают и не возвращают.
//
// Поле обязательно на экране, а не только на сервере: отказ, пришедший после нажатия,
// человек читает как поломку, а не как правило. Причину увидит тот, кого закрыли, и по
// ней же потом разбирают спор — поэтому её спрашивают до действия, а не после.
import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import styles from '../people.module.css'

export function AccessDialog({
  mode,
  busy,
  onCancel,
  onConfirm,
}: {
  mode: 'block' | 'unblock'
  busy: boolean
  onCancel: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const [asked, setAsked] = useState(false)
  const blank = reason.trim().length === 0

  return (
    <form
      className={styles.dialog}
      data-testid="access-dialog"
      onSubmit={(event) => {
        event.preventDefault()
        setAsked(true)
        if (!blank) onConfirm(reason.trim())
      }}
    >
      <label className={styles.reasonLabel} htmlFor="access-reason">
        {mode === 'block' ? 'Почему закрываем доступ' : 'Почему возвращаем доступ'}
      </label>
      <textarea
        id="access-reason"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        rows={3}
        data-testid="access-reason"
      />
      {asked && blank ? (
        <p className={styles.reasonError} data-testid="access-reason-error">
          Без причины нельзя: её увидит тот, кого это касается.
        </p>
      ) : null}
      <div className={styles.dialogActions}>
        <Button type="submit" disabled={busy} data-testid="access-confirm">
          {mode === 'block' ? 'Закрыть доступ' : 'Вернуть доступ'}
        </Button>
        <Button type="button" tone="ghost" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  )
}
