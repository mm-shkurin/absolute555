import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { ReasonPicker } from '../../../shared/ui/ReasonPicker'
import { COMPLAINT_REASONS } from '../../../shared/format/moderationReasonLabels'
import type { ComplaintReason } from '../../../shared/api/backend/moderationContract'
import styles from './ComplainSheet.module.css'

interface ComplainFormProps {
  busy: boolean
  failure: string | null
  onSend: (reason: ComplaintReason, text: string) => void
}

export function ComplainForm({ busy, failure, onSend }: ComplainFormProps) {
  const [reason, setReason] = useState<ComplaintReason | null>(null)
  const [text, setText] = useState('')
  return (
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
  )
}
