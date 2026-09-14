import { EmptyNotice, FailureNotice, ListSkeleton } from '../../../shared/ui/ListStates'
import type { useChats } from '../useChats'

interface ChatsStatusProps {
  chats: ReturnType<typeof useChats>
}

export function ChatsStatus({ chats }: ChatsStatusProps) {
  if (chats.isLoading) return <ListSkeleton />
  if (chats.error) return <FailureNotice message={chats.error.message} onRetry={chats.retry} />
  if (chats.dialogs.length > 0) return null
  return (
    <EmptyNotice title="Переписок пока нет">
      Чат заводится с карточки объявления — кнопкой «Написать».
    </EmptyNotice>
  )
}
