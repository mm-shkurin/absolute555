import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchChats,
  fetchMessages,
  markConversationRead,
  postMessage,
  type ChatWire,
} from './api/chatsApi'
import { openChatSocket } from '../../shared/api/backend/chatSocket'
import { toDialogs, toHeader, toMessages } from './logic/conversation'

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

export function useConversation(chat: ChatWire | null, now: Date) {
  const client = useQueryClient()
  const result = useQuery({
    queryKey: ['chat-messages', chat?.id],
    queryFn: ({ signal }) => fetchMessages(chat?.id ?? '', signal),
    // Без открытого диалога запрашивать нечего: пустой идентификатор ушёл бы на сервер
    // и вернулся 404, который экран показал бы как поломку.
    enabled: chat !== null,
  })

  const messages = result.data?.items ?? []

  // Открытый диалог считается прочитанным: человек смотрит на эти сообщения. Отметка
  // уходит после загрузки, а её ответ обновляет бейдж в таб-баре.
  useEffect(() => {
    if (!chat || messages.length === 0) return
    void markConversationRead(chat.id, messages).then((read) => {
      if (!read) return
      void client.invalidateQueries({ queryKey: ['chats'] })
      void client.invalidateQueries({ queryKey: ['chat-unread'] })
    })
  }, [chat, messages, client])

  const sending = useMutation({
    mutationFn: (text: string) => postMessage(chat?.id ?? '', text),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['chat-messages', chat?.id] })
      void client.invalidateQueries({ queryKey: ['chats'] })
    },
  })

  return {
    header: chat ? toHeader(chat) : null,
    messages: toMessages(messages, now),
    isLoading: result.isPending && chat !== null,
    send: (text: string) => {
      if (chat) sending.mutate(text)
    },
    sendFailed: (sending.error as Error | null) ?? null,
  }
}
