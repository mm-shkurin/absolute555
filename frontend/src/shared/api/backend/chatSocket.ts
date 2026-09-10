// Живой поток диалогов. WebSocket, а не SSE: по нему приходят чужие сообщения, пока
// человек смотрит на экран, и второе соединение ради отправки не нужно — отправка идёт
// обычным POST, а сюда возвращается уже записанное сервером.
import { currentSession } from '../../session/authSession'
import type { MessageWire } from './chatContract'
import { BACKEND } from './paths'

export interface ChatSocketHandlers {
  onMessage: (message: MessageWire) => void
  onClose?: () => void
}

/** Возвращает функцию закрытия. Без сессии соединение не поднимается вовсе: сервер
 *  закрыл бы его сразу, а немой открытый сокет выглядит как работающий. */
export function openChatSocket(handlers: ChatSocketHandlers): () => void {
  const session = currentSession()
  if (!session) return () => undefined

  const url = new URL(BACKEND.chat.socket(session.accessToken), window.location.origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  const socket = new WebSocket(url)

  socket.addEventListener('message', (event) => {
    try {
      // Сервер шлёт конверт `{type, message}`: развёрнутое сообщение пришло бы без
      // `dialog_id`, и обновился бы только список диалогов, но не открытая переписка.
      const frame = JSON.parse(event.data) as { type?: string; message?: MessageWire }
      if (frame.type !== 'message' || !frame.message) return
      handlers.onMessage(frame.message)
    } catch {
      // Одно испорченное сообщение не повод рвать поток: остальные придут следом.
    }
  })

  if (handlers.onClose) socket.addEventListener('close', handlers.onClose)

  return () => socket.close()
}
