// Диалоги и сообщения в том виде, в каком их читают: время коротко, дни разделены, своё
// и чужое различимо.
import { formatPrice } from '../../../shared/format/money'
import type { ChatWire, MessageWire } from '../api/chatsApi'

export interface DialogView {
  id: string
  name: string
  when: string
  listingTitle: string
  preview: string
  unread: number
}

export interface MessageView {
  id: string
  kind: 'text' | 'system'
  body: string
  time: string
  outgoing: boolean
}

export interface ConversationHeader {
  name: string
  listingId: string
  subtitle: string
}

const TIME = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })
const SHORT_DATE = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })

// В списке диалогов время сегодняшнего сообщения — часы, вчерашнего — слово, старого —
// дата. Полная дата у всех превратила бы список в таблицу, которую надо читать.
export function shortWhen(at: Date, now: Date): string {
  const days = dayGap(at, now)
  if (days <= 0) return TIME.format(at)
  if (days === 1) return 'вчера'
  return SHORT_DATE.format(at)
}

export function toDialogs(chats: ChatWire[], now: Date): DialogView[] {
  return chats.map((chat) => ({
    id: chat.id,
    name: chat.counterparty_name,
    when: shortWhen(new Date(chat.last_message_at), now),
    listingTitle: chat.listing_title,
    preview: chat.last_message,
    unread: chat.unread_count,
  }))
}

export function toHeader(chat: ChatWire): ConversationHeader {
  return {
    name: chat.counterparty_name,
    listingId: chat.listing_id,
    subtitle: `${chat.listing_title} · ${formatPrice(chat.listing_price)}`,
  }
}

// Разделители дней вставляются здесь, а не в разметке: это часть ленты сообщений, и
// компонент, который их считает, неизбежно начинает знать про календарь.
export function toMessages(messages: MessageWire[], now: Date): MessageView[] {
  const out: MessageView[] = []
  let lastDay: number | null = null
  for (const message of messages) {
    const at = new Date(message.created_at)
    const day = dayGap(at, now)
    if (day !== lastDay) {
      out.push({
        id: `day-${message.id}`,
        kind: 'system',
        body: dayTitle(at, day),
        time: '',
        outgoing: false,
      })
      lastDay = day
    }
    out.push({
      id: message.id,
      kind: message.kind,
      body: message.body,
      time: TIME.format(at),
      outgoing: message.outgoing,
    })
  }
  return out
}

function dayTitle(at: Date, gap: number): string {
  if (gap <= 0) return 'Сегодня'
  if (gap === 1) return 'Вчера'
  return SHORT_DATE.format(at)
}

function dayGap(at: Date, now: Date): number {
  return Math.round((startOfDay(now).getTime() - startOfDay(at).getTime()) / 86_400_000)
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}
