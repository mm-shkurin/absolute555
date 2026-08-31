// Чат: диалоги, сообщения, прочтение и живой поток.
import { send } from '../send'
import { BACKEND } from './paths'
import type {
  DialogWire,
  MessagePageWire,
  MessageWire,
  ReadResultWire,
  UnreadCountWire,
} from './chatContract'

/** Свежие диалоги первыми. Чужой диалог сервер называет ненайденным, а не запрещённым:
 *  запрет подтвердил бы, что разговор есть, а с ним — что по объявлению кто-то торгуется. */
export function fetchDialogs(signal?: AbortSignal) {
  return send<DialogWire[]>(BACKEND.chat.dialogs, { signal })
}

export function fetchMessages(
  dialogId: string,
  page: { page?: number; size?: number } = {},
  signal?: AbortSignal,
) {
  const params = new URLSearchParams()
  if (page.page !== undefined) params.set('page', String(page.page))
  if (page.size !== undefined) params.set('size', String(page.size))
  const query = params.toString()
  const path = BACKEND.chat.messages(dialogId)
  return send<MessagePageWire>(query ? `${path}?${query}` : path, { signal })
}

export function sendMessage(dialogId: string, text: string) {
  return send<MessageWire>(BACKEND.chat.messages(dialogId), { method: 'POST', body: { text } })
}

/** Прочтение посообщенно: отмечаются только чужие сообщения этого диалога, свои сервер
 *  игнорирует молча, а повторная отметка не двигает момент прочтения. */
export function markRead(dialogId: string, messageIds: string[]) {
  return send<ReadResultWire>(BACKEND.chat.read(dialogId), {
    method: 'POST',
    body: { message_ids: messageIds },
  })
}

/** Одно число для бейджа в таб-баре. Отдельная ручка, потому что бейдж рисуется на каждом
 *  экране, а выдача диалогов ради одного числа — страница на каждый переход. */
export function fetchUnread(signal?: AbortSignal) {
  return send<UnreadCountWire>(BACKEND.chat.unread, { signal })
}
