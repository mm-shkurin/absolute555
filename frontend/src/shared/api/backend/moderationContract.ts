// Модерация — контракт истории 9, `ProductSpecification/api-specs/moderation.yaml`.
import type { FeedCardWire } from './feedContract'
import type { SellerWire } from './saleCarContract'

/** Пять причин отказа, а не свободный текст: текст объясняет одному продавцу, что
 *  исправить, но только метка отвечает на вопрос «что мы отклоняем чаще всего». */
export type RejectionLabel =
  | 'plate_or_face_visible'
  | 'photos_of_another_car'
  | 'bait_price'
  | 'too_few_photos'
  | 'contacts_in_description'

export type ComplaintReason =
  'bait_price' | 'photos_of_another_car' | 'contacts_in_description' | 'sold_already' | 'other'

export type ComplaintStatus = 'open' | 'handled'

export interface QueueItemWire extends FeedCardWire {
  seller: SellerWire | null
  open_complaints: number
  submitted_at: string | null
}

export interface QueuePageWire {
  items: QueueItemWire[]
  total: number
  page: number
  size: number
}

export interface QueueCountsWire {
  waiting: number
  complained: number
  handled_today: number
}

export interface ComplaintWire {
  complaint_id: string
  sale_car_id: string
  author: SellerWire | null
  reason: ComplaintReason
  text: string | null
  status: ComplaintStatus
  created_at: string
  handled_at: string | null
}

/** Жалобы приходят сгруппированными по объявлению: модератор решает судьбу карточки,
 *  а не отдельной жалобы. */
export interface ComplaintGroupWire {
  sale_car_id: string
  listing: FeedCardWire | null
  complaints: ComplaintWire[]
}

export interface ComplaintPageWire {
  items: ComplaintGroupWire[]
  total: number
  page: number
  size: number
}
