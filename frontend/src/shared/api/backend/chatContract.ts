// Чат — контракт истории 11, `ProductSpecification/api-specs/chat.yaml`.
//
// Диалог заводится вместе с предложением по цене, а не отдельным вызовом: разговор один
// на пару и объявление, и второе предложение попадает в тот же.
import type { FeedCardWire } from './feedContract'
import type { SellerWire } from './saleCarContract'

/** Системные строки пишет сервер: «предложение принято» не должен уметь прислать клиент. */
export type MessageKind = 'text' | 'system'

export interface MessageWire {
  message_id: string
  dialog_id: string
  /** Пусто у системных строк — их пишет сервер, а не человек. */
  author_id: string | null
  kind: MessageKind
  text: string
  read_at: string | null
  created_at: string
}

export interface DialogWire {
  dialog_id: string
  sale_car_id: string
  listing: FeedCardWire | null
  /** Собеседник — тот из пары, кто не спрашивает. */
  counterpart: SellerWire | null
  last_message: MessageWire | null
  unread: number
}

export interface MessagePageWire {
  items: MessageWire[]
  total: number
  page: number
  size: number
}

export interface ReadResultWire {
  marked: number
  unread: number
}

export interface UnreadCountWire {
  unread: number
}
