import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import styles from './Conversation.module.css'

interface MessageComposerProps {
  onSend: (text: string) => void
}

export function MessageComposer({ onSend }: MessageComposerProps) {
  const [draft, setDraft] = useState('')
  const send = () => {
    if (!draft.trim()) return
    onSend(draft.trim())
    setDraft('')
  }

  return (
    <div className={styles.send}>
      <input
        className={styles.sendField}
        value={draft}
        placeholder="Написать сообщение"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') send()
        }}
        data-testid="message-input"
      />
      <Button onClick={send}>Отправить</Button>
    </div>
  )
}
