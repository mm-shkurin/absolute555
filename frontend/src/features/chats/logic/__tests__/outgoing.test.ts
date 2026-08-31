import { describe, expect, it } from 'vitest'
import { toDialogs } from '../conversation'
import type { ChatWire } from '../../api/chatsApi'

const chat = (over: Partial<ChatWire> = {}): ChatWire => ({
  id: 'd1',
  counterparty_name: 'Иван',
  listing_id: 'c1',
  listing_title: 'Toyota Camry',
  listing_price: 1390000,
  last_message: 'Здравствуйте',
  last_message_at: new Date('2026-08-31T09:00:00').toISOString(),
  unread_count: 2,
  ...over,
})

describe('список диалогов', () => {
  it('показывает непрочитанные и последнее сообщение', () => {
    const [dialog] = toDialogs([chat()], new Date('2026-08-31T12:00:00'))
    expect(dialog.unread).toBe(2)
    expect(dialog.preview).toBe('Здравствуйте')
  })

  it('переживает диалог без единого сообщения: он заводится вместе с предложением', () => {
    const [dialog] = toDialogs(
      [chat({ last_message: '', last_message_at: '', unread_count: 0 })],
      new Date('2026-08-31T12:00:00'),
    )
    expect(dialog.preview).toBe('')
    expect(dialog.unread).toBe(0)
  })
})
