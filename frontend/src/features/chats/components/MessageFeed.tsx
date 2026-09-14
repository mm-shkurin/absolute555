import { memo, useEffect, useRef } from 'react'
import type { MessageView } from '../logic/conversation'
import styles from './Conversation.module.css'

interface MessageFeedProps {
  messages: MessageView[]
}

export function MessageFeed({ messages }: MessageFeedProps) {
  const feed = useRef<HTMLDivElement>(null)

  // Переписку открывают ради последней реплики, а не первой: без этого человек каждый раз
  // прокручивает месяц разговора вниз руками.
  useEffect(() => {
    const element = feed.current
    if (element) element.scrollTop = element.scrollHeight
  }, [messages])

  return (
    <div className={styles.body} ref={feed}>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  )
}

interface MessageBubbleProps {
  message: MessageView
}

const MessageBubble = memo(function MessageBubble({ message }: MessageBubbleProps) {
  if (message.kind === 'system') return <div className={styles.system}>{message.body}</div>
  return (
    <div className={[styles.message, message.outgoing ? styles.me : styles.them].join(' ')}>
      {message.body}
      <span className={styles.time}>{message.time}</span>
    </div>
  )
})
