// Переписка: шапка с машиной, лента сообщений, поле ввода. Разделители дней приходят из
// логики вместе с сообщениями — компонент про календарь ничего не знает.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, buttonClass } from '../../../shared/ui/Button'
import { Placeholder } from '../../../shared/ui/Placeholder'
import { ROUTES } from '../../../shared/navigation/routes'
import type { ConversationHeader, MessageView } from '../logic/conversation'
import styles from '../chats.module.css'

export function Conversation({
  header,
  messages,
  onSend,
}: {
  header: ConversationHeader
  messages: MessageView[]
  onSend: (text: string) => void
}) {
  const [draft, setDraft] = useState('')
  const send = () => {
    if (!draft.trim()) return
    onSend(draft.trim())
    setDraft('')
  }

  return (
    <div className={styles.conversation} data-testid="conversation">
      <div className={styles.conversationTop}>
        <Placeholder className={styles.thumb}>фото</Placeholder>
        <div>
          <div className={styles.who}>{header.name}</div>
          <div className={styles.about}>{header.subtitle}</div>
        </div>
        <Link
          to={ROUTES.listing(header.listingId)}
          className={buttonClass({ tone: 'ghost', size: 'small' })}
        >
          К объявлению
        </Link>
      </div>
      <div className={styles.body}>
        {messages.map((message) =>
          message.kind === 'system' ? (
            <div key={message.id} className={styles.system}>
              {message.body}
            </div>
          ) : (
            <div
              key={message.id}
              className={[styles.message, message.outgoing ? styles.me : styles.them].join(' ')}
            >
              {message.body}
              <span className={styles.time}>{message.time}</span>
            </div>
          ),
        )}
      </div>
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
    </div>
  )
}
