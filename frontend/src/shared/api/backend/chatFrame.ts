import type { MessageWire } from './chatContract'

/** Сообщение из кадра живого потока или `null`, если кадр не про сообщение.
 *
 *  Сервер шлёт конверт `{type, message}`: развёрнутое сообщение пришло бы без
 *  `dialog_id`, и обновился бы только список диалогов, но не открытая переписка. */
export function messageFromFrame(data: unknown): MessageWire | null {
  if (typeof data !== 'string') return null
  try {
    const frame = JSON.parse(data) as { type?: string; message?: MessageWire }
    return frame.type === 'message' && frame.message ? frame.message : null
  } catch {
    // Одно испорченное сообщение не повод рвать поток: остальные придут следом.
    return null
  }
}
