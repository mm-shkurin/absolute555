import { describe, expect, it } from 'vitest'
import { shortWhen, toDialogs, toMessages } from '../conversation'
import type { ChatWire, MessageWire } from '../../api/chatsApi'

const now = new Date(2026, 7, 28, 18, 0)

const chat: ChatWire = {
  id: 'c1',
  counterparty_name: 'Дмитрий',
  listing_id: 'l1',
  listing_title: 'Lexus LX 570',
  listing_price: 4020000,
  last_message: 'А по документам всё чисто?',
  last_message_at: new Date(2026, 7, 28, 14, 58).toISOString(),
  unread_count: 2,
}

describe('чаты', () => {
  it('время сегодняшнего сообщения — часы, вчерашнего — слово, старого — дата', () => {
    expect(shortWhen(new Date(2026, 7, 28, 14, 58), now)).toBe('14:58')
    expect(shortWhen(new Date(2026, 7, 27, 9, 0), now)).toBe('вчера')
    expect(shortWhen(new Date(2026, 7, 21, 9, 0), now)).toBe('21 авг.')
  })

  it('диалог называет объявление и считает непрочитанные', () => {
    const [dialog] = toDialogs([chat], now)
    expect(dialog).toMatchObject({
      name: 'Дмитрий',
      listingTitle: 'Lexus LX 570',
      when: '14:58',
      unread: 2,
    })
  })

  it('вставляет разделитель дня перед первым сообщением каждого дня', () => {
    const messages: MessageWire[] = [
      {
        id: 'm1',
        kind: 'text',
        body: 'вчерашнее',
        created_at: new Date(2026, 7, 27, 14, 41).toISOString(),
        outgoing: false,
        read_at: null,
      },
      {
        id: 'm2',
        kind: 'text',
        body: 'сегодняшнее',
        created_at: new Date(2026, 7, 28, 15, 4).toISOString(),
        outgoing: true,
        read_at: null,
      },
    ]
    const view = toMessages(messages, now)
    expect(view.map((item) => item.body)).toEqual(['Вчера', 'вчерашнее', 'Сегодня', 'сегодняшнее'])
    expect(view[3].outgoing).toBe(true)
    expect(view[3].time).toBe('15:04')
  })
})
