// Отзывы и публичный профиль продавца — контракт истории 12,
// `ProductSpecification/api-specs/seller_rating.yaml`.
import type { FeedCardWire } from './feedContract'

export interface ReviewAuthorWire {
  user_id: string
  name: string | null
  avatar_url: string | null
}

export interface ReviewWire {
  review_id: string
  offer_id: string
  sale_car_id: string | null
  seller_id: string
  author: ReviewAuthorWire | null
  rating: number
  text: string | null
  created_at: string
  updated_at: string | null
  /** До какого момента автор правит свой отзыв. Приезжает, чтобы экран гасил кнопку сам,
   *  а не узнавал о закрытом окне из ответа 409. */
  editable_until: string | null
}

export interface ReviewPageWire {
  items: ReviewWire[]
  total: number
  page: number
  size: number
}

export interface ReviewCreate {
  rating: number
  text?: string | null
}

/** Поле, которого нет в теле, остаётся прежним: правка — не переписывание. */
export type ReviewPatch = Partial<ReviewCreate>

export interface SellerProfileWire {
  user_id: string
  name: string | null
  avatar_url: string | null
  rating: number | null
  reviews_count: number
  /** Принятые офферы, а не отзывы. */
  deals_count: number
  listings_count: number
  member_since: string | null
}

/** Профиль не заводит своей формы объявления — та же карточка, что в ленте. */
export interface SellerListingPageWire {
  items: FeedCardWire[]
  total: number
  page: number
  size: number
}
