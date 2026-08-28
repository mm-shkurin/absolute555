import { useQuery } from '@tanstack/react-query'
import { fetchChats, fetchMessages, type ChatWire } from './api/chatsApi'
import { toDialogs, toHeader, toMessages } from './logic/conversation'

export function useChats(now: Date) {
  const result = useQuery({ queryKey: ['chats'], queryFn: ({ signal }) => fetchChats(signal) })
  const chats: ChatWire[] = result.data?.items ?? []
  return {
    chats,
    dialogs: toDialogs(chats, now),
    isLoading: result.isPending,
    error: (result.error as Error | null) ?? null,
    retry: () => void result.refetch(),
  }
}

export function useConversation(chat: ChatWire | null, now: Date) {
  const result = useQuery({
    queryKey: ['chat-messages', chat?.id],
    queryFn: ({ signal }) => fetchMessages(chat?.id ?? '', signal),
    // Без открытого диалога запрашивать нечего: пустой идентификатор ушёл бы на сервер
    // и вернулся 404, который экран показал бы как поломку.
    enabled: chat !== null,
  })
  return {
    header: chat ? toHeader(chat) : null,
    messages: toMessages(result.data?.items ?? [], now),
    isLoading: result.isPending && chat !== null,
  }
}
