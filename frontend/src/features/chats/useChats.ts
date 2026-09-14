import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchChats, type ChatWire } from './api/chatsApi'
import { openChatSocket } from '../../shared/api/backend/chatSocket'
import { toDialogs } from './logic/conversation'

export { useConversation } from './useConversation'

export function useChats(now: Date) {
  const client = useQueryClient()
  const result = useQuery({ queryKey: ['chats'], queryFn: ({ signal }) => fetchChats(signal) })

  // Живой поток обновляет и открытый диалог, и список: чужое сообщение меняет и ленту
  // переписки, и превью с непрочитанными в списке слева.
  useEffect(
    () =>
      openChatSocket({
        onMessage: (message) => {
          void client.invalidateQueries({ queryKey: ['chat-messages', message.dialog_id] })
          void client.invalidateQueries({ queryKey: ['chats'] })
          void client.invalidateQueries({ queryKey: ['chat-unread'] })
        },
      }),
    [client],
  )

  const chats: ChatWire[] = result.data?.items ?? []
  return {
    chats,
    dialogs: toDialogs(chats, now),
    isLoading: result.isPending,
    error: (result.error as Error | null) ?? null,
    retry: () => void result.refetch(),
  }
}
