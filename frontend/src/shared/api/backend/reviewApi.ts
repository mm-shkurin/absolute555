// Отзыв о сделке и публичный профиль продавца.
import { send } from '../send'
import { sendPublic } from '../sendPublic'
import { BACKEND } from './paths'
import type {
  ReviewCreate,
  ReviewPageWire,
  ReviewPatch,
  ReviewWire,
  SellerListingPageWire,
  SellerProfileWire,
} from './reviewContract'

interface Page {
  page?: number
  size?: number
}

function paged(path: string, { page, size }: Page): string {
  const params = new URLSearchParams()
  if (page !== undefined) params.set('page', String(page))
  if (size !== undefined) params.set('size', String(size))
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

/** Отзыв пишет автор принятого оффера. Повторный сервер отвергает и называет в отказе
 *  идентификатор написанного — экрану есть куда перейти вместо второй попытки. */
export function createReview(offerId: string, review: ReviewCreate) {
  return send<ReviewWire>(BACKEND.review.ofOffer(offerId), { method: 'POST', body: review })
}

/** Окно правки — сутки. Удаления нет: удаляемый отзыв становится предметом торга. */
export function updateReview(reviewId: string, patch: ReviewPatch) {
  return send<ReviewWire>(BACKEND.review.one(reviewId), { method: 'PATCH', body: patch })
}

/** Профиль открыт гостю: рейтинг — часть решения о покупке. */
export function fetchSellerProfile(userId: string, signal?: AbortSignal) {
  return sendPublic<SellerProfileWire>(BACKEND.seller.one(userId), { signal })
}

export function fetchSellerReviews(userId: string, page: Page = {}, signal?: AbortSignal) {
  return sendPublic<ReviewPageWire>(paged(BACKEND.seller.reviews(userId), page), { signal })
}

export function fetchSellerListings(userId: string, page: Page = {}, signal?: AbortSignal) {
  return sendPublic<SellerListingPageWire>(paged(BACKEND.seller.listings(userId), page), { signal })
}
