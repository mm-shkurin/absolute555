// Живой поток диалогов. WebSocket, а не SSE: по нему приходят чужие сообщения, пока
// человек смотрит на экран, и второе соединение ради отправки не нужно — отправка идёт
// обычным POST, а сюда возвращается уже записанное сервером.
import { browserWindow } from '../../lib/browser'
import { currentSession } from '../../session/authSession'
import { messageFromFrame } from './chatFrame'
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
  const origin = browserWindow()?.location.origin
  if (!session || !origin) return () => undefined

  const url = new URL(BACKEND.chat.socket(session.accessToken), origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  const socket = new WebSocket(url)

  socket.addEventListener('message', (event) => {
    const message = messageFromFrame(event.data)
    if (message) handlers.onMessage(message)
  })

  if (handlers.onClose) socket.addEventListener('close', handlers.onClose)

  return () => socket.close()
}
