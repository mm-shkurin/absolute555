// Фикстуры чата и очереди модерации в форме провода. Отдельно от объявлений: у них своя
// предметная область, свои схемы и свой контракт — `chat.yaml` и `moderation.yaml`.
import type { DialogWire, MessageWire } from '../../shared/api/backend/chatContract'
import type {
  ComplaintPageWire,
  QueueCountsWire,
  QueuePageWire,
} from '../../shared/api/backend/moderationContract'
import { FEED } from './cars'
import { CHATS, MESSAGES } from './rest'
import { COMPLAINTS, QUEUE } from './moderation'
import { toCard, VIEWER_ID } from './wire'

export function queuePage(): QueuePageWire {
  const items = QUEUE.map((item, index) => ({
    ...toCard(FEED[index % FEED.length]),
    sale_car_id: item.listing_id,
    status: 'moderation' as const,
    seller: { user_id: `u${index}`, name: item.seller_name, avatar_url: null },
    open_complaints: item.complaints_count,
    submitted_at: item.submitted_at,
  }))
  return { items, total: items.length, page: 1, size: 20 }
}

export function queueCounts(): QueueCountsWire {
  return { waiting: QUEUE.length, complained: COMPLAINTS.length, handled_today: 7 }
}

export function complaintPage(): ComplaintPageWire {
  const items = COMPLAINTS.map((group, index) => ({
    sale_car_id: group.listing_id,
    listing: { ...toCard(FEED[index % FEED.length]), sale_car_id: group.listing_id },
    complaints: group.complaints.map((complaint) => ({
      complaint_id: complaint.id,
      sale_car_id: group.listing_id,
      author: { user_id: 'u7', name: complaint.author_name, avatar_url: null },
      reason: 'other' as const,
      text: complaint.body,
      status: 'open' as const,
      created_at: complaint.created_at,
      handled_at: null,
    })),
  }))
  return { items, total: items.length, page: 1, size: 20 }
}

export function dialogs(): DialogWire[] {
  return CHATS.map((chat, index) => ({
    dialog_id: chat.id,
    sale_car_id: chat.listing_id,
    listing: { ...toCard(FEED[index % FEED.length]), sale_car_id: chat.listing_id },
    counterpart: { user_id: `u${index + 2}`, name: chat.counterparty_name, avatar_url: null },
    last_message: {
      message_id: `last-${chat.id}`,
      dialog_id: chat.id,
      author_id: `u${index + 2}`,
      kind: 'text' as const,
      text: chat.last_message,
      read_at: null,
      created_at: chat.last_message_at,
    },
    unread: chat.unread_count,
  }))
}

export function messages(dialogId: string): MessageWire[] {
  return MESSAGES.map((message) => ({
    message_id: message.id,
    dialog_id: dialogId,
    author_id: message.kind === 'system' ? null : message.outgoing ? VIEWER_ID : 'u2',
    kind: message.kind,
    text: message.body,
    read_at: message.read_at,
    created_at: message.created_at,
  }))
}
