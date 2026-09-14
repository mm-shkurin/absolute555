import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchMessages,
  markConversationRead,
  postMessage,
  type ChatWire,
  type MessageWire,
} from './api/chatsApi'
import { toHeader, toMessages } from './logic/conversation'

function useMarkRead(chat: ChatWire | null, messages: MessageWire[]) {
  const client = useQueryClient()
  // Открытый диалог считается прочитанным: человек смотрит на эти сообщения. Отметка
  // уходит после загрузки, а её ответ обновляет бейдж в таб-баре.
  useEffect(() => {
    if (!chat || messages.length === 0) return
    let cancelled = false
    void markConversationRead(chat.id, messages).then((read) => {
      if (cancelled || !read) return
      void client.invalidateQueries({ queryKey: ['chats'] })
      void client.invalidateQueries({ queryKey: ['chat-unread'] })
    })
    return () => {
      cancelled = true
    }
  }, [chat, messages, client])
}

function useSendMessage(chat: ChatWire | null) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (text: string) => postMessage(chat?.id ?? '', text),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['chat-messages', chat?.id] })
      void client.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}

export function useConversation(chat: ChatWire | null, now: Date) {
  const result = useQuery({
    queryKey: ['chat-messages', chat?.id],
    queryFn: ({ signal }) => fetchMessages(chat?.id ?? '', signal),
    // Без открытого диалога запрашивать нечего: пустой идентификатор ушёл бы на сервер
    // и вернулся 404, который экран показал бы как поломку.
    enabled: chat !== null,
  })
  const messages = result.data?.items ?? []
  useMarkRead(chat, messages)
  const sending = useSendMessage(chat)

  return {
    header: chat ? toHeader(chat) : null,
    messages: toMessages(messages, now),
    isLoading: result.isPending && chat !== null,
    send: (text: string) => {
      if (chat) sending.mutate(text)
    },
    sendFailed: sending.error,
  }
}
