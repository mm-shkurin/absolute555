// Переписка: шапка с машиной, лента сообщений, поле ввода. Разделители дней приходят из
// логики вместе с сообщениями — компонент про календарь ничего не знает.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, buttonClass } from '../../../shared/ui/Button'
import { Cover } from '../../../shared/ui/Cover'
import { ROUTES } from '../../../shared/navigation/routes'
import type { ConversationHeader, MessageView } from '../logic/conversation'
import styles from './Conversation.module.css'

export function Conversation({
  header,
  messages,
  onSend,
  onBack,
  onReview,
}: {
  header: ConversationHeader
  messages: MessageView[]
  onSend: (text: string) => void
  onBack?: () => void
  onReview?: () => void
}) {
  const [draft, setDraft] = useState('')
  const feed = useRef<HTMLDivElement>(null)

  // Переписку открывают ради последней реплики, а не первой: без этого человек каждый раз
  // прокручивает месяц разговора вниз руками.
  useEffect(() => {
    const element = feed.current
    if (element) element.scrollTop = element.scrollHeight
  }, [messages])

  const send = () => {
    if (!draft.trim()) return
    onSend(draft.trim())
    setDraft('')
  }

  return (
    <div className={styles.conversation} data-pane="conversation" data-testid="conversation">
      <div className={styles.conversationTop}>
        {onBack ? (
          <button type="button" className={styles.back} onClick={onBack} aria-label="К диалогам">
            ‹
          </button>
        ) : null}
        <Cover className={styles.thumb} url={header.photoUrl} caption="фото" />
        <div className={styles.headText}>
          <div className={styles.who}>
            {header.counterpartHref ? (
              <Link to={header.counterpartHref} data-testid="counterpart-link">
                {header.name}
              </Link>
            ) : (
              header.name
            )}
          </div>
          <div className={styles.about}>{header.subtitle}</div>
        </div>
        {header.reviewLabel && onReview ? (
          <Button tone="ghost" size="small" onClick={onReview} data-testid="chat-review">
            {header.reviewLabel}
          </Button>
        ) : null}
        {/* У переписки по заявке объявления нет: кнопка вела бы на несуществующую карточку. */}
        {header.listingId ? (
          <Link
            to={ROUTES.listing(header.listingId)}
            className={buttonClass({ tone: 'ghost', size: 'small' })}
          >
            К объявлению
          </Link>
        ) : null}
      </div>
      <div className={styles.body} ref={feed}>
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
