// Жалоба на объявление: причина из списка плюс необязательный текст. Список, а не поле:
// свободный текст объясняет одному модератору один случай, но только причина отвечает на
// вопрос «на что жалуются чаще всего».
import { useState } from 'react'
import { Sheet } from '../../../shared/ui/Sheet'
import { Button } from '../../../shared/ui/Button'
import { ReasonPicker } from '../../../shared/ui/ReasonPicker'
import { COMPLAINT_REASONS } from '../../../shared/domain/moderationReasons'
import type { ComplaintReason } from '../../../shared/api/backend/moderationContract'
import styles from './ComplainSheet.module.css'

export function ComplainSheet({
  busy,
  failure,
  sent,
  onClose,
  onSend,
}: {
  busy: boolean
  failure: string | null
  sent: boolean
  onClose: () => void
  onSend: (reason: ComplaintReason, text: string) => void
}) {
  const [reason, setReason] = useState<ComplaintReason | null>(null)
  const [text, setText] = useState('')

  return (
    <Sheet title="Пожаловаться на объявление" onClose={onClose} testId="complain-sheet">
      {sent ? (
        <p className={styles.done} data-testid="complain-done">
          Жалоба отправлена. Модератор посмотрит карточку — решение принимает человек.
        </p>
      ) : (
        <>
          <ReasonPicker
            options={COMPLAINT_REASONS}
            current={reason}
            disabled={busy}
            onPick={setReason}
          />
          <textarea
            className={styles.text}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Что не так. Текст увидит модератор, продавец — нет."
          />
          {failure ? <p className={styles.failure}>{failure}</p> : null}
          <Button
            block
            disabled={busy || reason === null}
            onClick={() => reason && onSend(reason, text)}
          >
            Отправить жалобу
          </Button>
        </>
      )}
    </Sheet>
  )
}
