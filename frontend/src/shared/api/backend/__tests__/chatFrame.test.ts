import { describe, expect, it } from 'vitest'
import { messageFromFrame } from '../chatFrame'

// Копия кадра, который шлёт `chat_hub.deliver` (backend/app/features/chat/api/chat.py):
// конверт с типом и `MessageResponse` в режиме JSON.
const serverFrame = JSON.stringify({
  type: 'message',
  message: {
    message_id: 'm1',
    dialog_id: 'd1',
    author_id: 'u2',
    kind: 'text',
    text: 'А по документам всё чисто?',
    read_at: null,
    created_at: '2026-09-14T10:00:00Z',
  },
})

describe('живой поток переписки', () => {
  it('Scenario: вторая сторона получает сообщение в открытую переписку без перезагрузки', () => {
    // Given собеседник написал в диалог d1
    // When сервер присылает кадр
    const message = messageFromFrame(serverFrame)
    // Then сообщение попадает в диалог d1 с текстом собеседника
    expect(message?.dialog_id).toBe('d1')
    expect(message?.text).toBe('А по документам всё чисто?')
  })

  it('кадр без конверта не принимается за сообщение', () => {
    expect(messageFromFrame(JSON.stringify({ message_id: 'm1', text: 'голое' }))).toBeNull()
  })

  it('испорченный кадр не роняет поток', () => {
    expect(messageFromFrame('не json')).toBeNull()
  })
})
