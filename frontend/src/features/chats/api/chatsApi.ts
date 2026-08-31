// Чаты и переписка по контракту истории 11 (`api-specs/chat.yaml`). Список диалогов и
// сообщения одного диалога — разные запросы: список нужен всегда, сообщения — только у
// открытого.
import {
  fetchDialogs,
  fetchMessages as fetchMessagePage,
  markRead,
  sendMessage,
} from '../../../shared/api/backend/chatApi'
import type {
  DialogWire,
  MessageWire as WireMessage,
} from '../../../shared/api/backend/chatContract'
import { currentSession } from '../../../shared/session/authSession'

export type MessageKind = 'text' | 'system'

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

export interface MessageWire {
  id: string
  kind: MessageKind
  body: string
  created_at: string
  outgoing: boolean
  /** Прочитано ли собеседником. У чужих сообщений не показывается. */
  read_at: string | null
}

function toChat(dialog: DialogWire): ChatWire {
  const listing = dialog.listing
  const last = dialog.last_message
  return {
    id: dialog.dialog_id,
    // Имя приходит от провайдера входа собеседника; у кого его нет — пусто, и экран
    // покажет объявление вместо выдуманного имени.
    counterparty_name: dialog.counterpart?.name ?? '',
    listing_id: dialog.sale_car_id,
    listing_title: `${listing?.brand ?? ''} ${listing?.model ?? ''}`.trim(),
    listing_price: listing?.price ?? 0,
    last_message: last?.text ?? '',
    // Диалог без единого сообщения заводится вместе с предложением: времени у него нет,
    // и время создания подставить неоткуда.
    last_message_at: last?.created_at ?? '',
    unread_count: dialog.unread,
  }
}

// Своё сообщение отличается автором, а не флагом с сервера: провод отдаёт `author_id`,
// и один и тот же диалог у двух участников выглядит по-разному.
function toMessage(message: WireMessage, viewerId: string | null): MessageWire {
  return {
    id: message.message_id,
    kind: message.kind,
    body: message.text,
    created_at: message.created_at,
    outgoing: message.author_id !== null && message.author_id === viewerId,
    read_at: message.read_at,
  }
}

export async function fetchChats(signal?: AbortSignal): Promise<{ items: ChatWire[] }> {
  const dialogs = await fetchDialogs(signal)
  return { items: dialogs.map(toChat) }
}

export async function fetchMessages(
  chatId: string,
  signal?: AbortSignal,
): Promise<{ items: MessageWire[] }> {
  const viewerId = currentSession()?.userId ?? null
  const page = await fetchMessagePage(chatId, {}, signal)
  return { items: page.items.map((message) => toMessage(message, viewerId)) }
}

export async function postMessage(chatId: string, text: string): Promise<MessageWire> {
  const viewerId = currentSession()?.userId ?? null
  return toMessage(await sendMessage(chatId, text), viewerId)
}

/** Отмечает прочитанными чужие непрочитанные сообщения открытого диалога. Свои сервер
 *  игнорирует молча, поэтому фильтровать их здесь незачем — но пустой список он отвергает. */
export async function markConversationRead(chatId: string, messages: MessageWire[]) {
  const ids = messages.filter((message) => !message.outgoing && !message.read_at).map((m) => m.id)
  if (ids.length === 0) return null
  return markRead(chatId, ids)
}
