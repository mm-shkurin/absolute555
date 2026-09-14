import type { ChatWire } from '../api/chatsApi'
import type { DialogView } from '../logic/conversation'
import type { useConversation } from '../useConversation'
import type { useReview } from '../../../shared/review/useReview'
import { Conversation } from './Conversation'
import { DialogList } from './DialogList'
import styles from '../chats.module.css'

interface ChatsBoardProps {
  dialogs: DialogView[]
  current: ChatWire | null
  phone: boolean
  conversation: ReturnType<typeof useConversation>
  review: ReturnType<typeof useReview>
  onSelect: (id: string | null) => void
}

export function ChatsBoard(props: ChatsBoardProps) {
  const { dialogs, current, phone, conversation, review, onSelect } = props
  const onReview = current
    ? () => review.open({ dialogId: current.id, reviewId: current.review_id ?? null })
    : undefined
  return (
    <div className={styles.chat} data-view={phone && current ? 'conversation' : 'list'}>
      <DialogList dialogs={dialogs} current={current?.id ?? null} onSelect={onSelect} />
      {conversation.header ? (
        <Conversation
          header={conversation.header}
          messages={conversation.messages}
          onSend={conversation.send}
          onBack={phone ? () => onSelect(null) : undefined}
          onReview={onReview}
        />
      ) : null}
    </div>
  )
}
