// Чаты и переписка. Список диалогов и сообщения одного диалога — разные запросы: список
// нужен всегда, сообщения — только у открытого.
import { API } from '../../../shared/api/endpoints'
import { send } from '../../../shared/api/send'

export interface ChatWire {
  id: string
  counterparty_name: string
  listing_id: string
  listing_title: string
  listing_price: number
  last_message: string
  last_message_at: string
  unread_count: number
}

export type MessageKind = 'text' | 'system'

export interface MessageWire {
  id: string
  kind: MessageKind
  body: string
  created_at: string
  outgoing: boolean
}

export async function fetchChats(signal?: AbortSignal): Promise<{ items: ChatWire[] }> {
  return send<{ items: ChatWire[] }>(API.chats.collection, { signal })
}

export async function fetchMessages(
  chatId: string,
  signal?: AbortSignal,
): Promise<{ items: MessageWire[] }> {
  return send<{ items: MessageWire[] }>(API.chats.messages(chatId), { signal })
}
