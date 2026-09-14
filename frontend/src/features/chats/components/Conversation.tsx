// Переписка: шапка с машиной, лента сообщений, поле ввода. Разделители дней приходят из
// логики вместе с сообщениями — компонент про календарь ничего не знает.
import type { ConversationHeader, MessageView } from '../logic/conversation'
import { ConversationTop } from './ConversationTop'
import { MessageComposer } from './MessageComposer'
import { MessageFeed } from './MessageFeed'
import styles from './Conversation.module.css'

interface ConversationProps {
  header: ConversationHeader
  messages: MessageView[]
  onSend: (text: string) => void
  onBack?: () => void
  onReview?: () => void
}

export function Conversation({ header, messages, onSend, onBack, onReview }: ConversationProps) {
  return (
    <div className={styles.conversation} data-pane="conversation" data-testid="conversation">
      <ConversationTop header={header} onBack={onBack} onReview={onReview} />
      <MessageFeed messages={messages} />
      <MessageComposer onSend={onSend} />
    </div>
  )
}
