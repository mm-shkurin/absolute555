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
  /** Разговор по объявлению или по заявке: у второго нет карточки, к которой вести. */
  subject: 'listing' | 'request' | 'direct'
  counterparty_name: string
  counterparty_avatar: string | null
  /** Собеседник — к его странице с отзывами ведёт имя в шапке. */
  counterparty_id?: string
  /** Оценивает спрашивавший в переписке; право называет сервер. */
  can_review?: boolean
  review_id?: string | null
  listing_id: string
  listing_title: string
  listing_price: number
  listing_photo: string | null
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

function requestTitle(request: NonNullable<DialogWire['request']>): string {
  const car = [request.brand ?? '', request.model ?? ''].join(' ').trim()
  return `Заявка: ${car || 'без марки'}`
}

type ChatBase = Omit<ChatWire, 'subject' | 'listing_title'>

function baseChat(dialog: DialogWire): ChatBase {
  return {
    id: dialog.dialog_id,
    // Имя приходит от провайдера входа собеседника; у кого его нет — пусто, и экран
    // покажет объявление вместо выдуманного имени.
    counterparty_name: dialog.counterpart?.name ?? '',
    counterparty_avatar: dialog.counterpart?.avatar_url ?? null,
    counterparty_id: dialog.counterpart?.user_id ?? '',
    can_review: dialog.can_review ?? false,
    review_id: dialog.review_id ?? null,
    listing_id: '',
    listing_price: 0,
    listing_photo: null,
    last_message: dialog.last_message?.text ?? '',
    // Диалог без единого сообщения заводится вместе с предложением: времени у него нет,
    // и время создания подставить неоткуда.
    last_message_at: dialog.last_message?.created_at ?? '',
    unread_count: dialog.unread,
  }
}

// Прямая переписка — обращение в компанию поставщика. Покупатель пишет витрине, а не
// человеку: у него в шапке название и фото витрины. Поставщик видит покупателя, а
// подпись говорит, в какую витрину обратились.
function toDirectChat(dialog: DialogWire): ChatWire {
  const base = baseChat(dialog)
  const storefront = dialog.storefront ?? null
  const toStorefront = storefront !== null && storefront.user_id === dialog.counterpart?.user_id
  const company = storefront?.company_name ?? ''
  const addressed = company ? `Обращение в «${company}»` : 'Обращение к поставщику'
  return {
    ...base,
    subject: 'direct',
    counterparty_name: toStorefront && company ? company : base.counterparty_name,
    counterparty_avatar: (toStorefront ? storefront?.cover_url : null) ?? base.counterparty_avatar,
    listing_title: toStorefront ? 'Обращение к поставщику' : addressed,
  }
}

function toRequestChat(dialog: DialogWire, request: NonNullable<DialogWire['request']>): ChatWire {
  return {
    ...baseChat(dialog),
    subject: 'request',
    listing_title: requestTitle(request),
    // Бюджет вместо цены: заявка называет потолок, а не то, за сколько продают.
    listing_price: request.budget_max ?? 0,
  }
}

function toListingChat(dialog: DialogWire): ChatWire {
  const listing = dialog.listing
  return {
    ...baseChat(dialog),
    subject: 'listing',
    listing_id: dialog.sale_car_id ?? '',
    listing_title: `${listing?.brand ?? ''} ${listing?.model ?? ''}`.trim(),
    listing_price: listing?.price ?? 0,
    listing_photo: listing?.preview_photo_url ?? null,
  }
}

function toChat(dialog: DialogWire): ChatWire {
  if (dialog.request) return toRequestChat(dialog, dialog.request)
  if (dialog.listing) return toListingChat(dialog)
  return toDirectChat(dialog)
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
