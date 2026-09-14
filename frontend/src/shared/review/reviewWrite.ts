import type { QueryClient } from '@tanstack/react-query'
import { createDialogReview, createReview, updateReview } from '../api/backend/reviewApi'
import { isHttpError } from '../api/httpClient'
import type { ReviewTarget } from './useReview'

export function writeReview(target: ReviewTarget | null, rating: number, text: string) {
  const body = text.trim() ? { rating, text: text.trim() } : { rating }
  if (target?.reviewId) return updateReview(target.reviewId, body)
  if (target?.dialogId) return createDialogReview(target.dialogId, body)
  return createReview(target?.offerId ?? '', body)
}

// Отзыв меняет агрегат продавца, а он едет в каждом блоке seller: перечитываются
// и офферы, и всё, где этот блок нарисован.
export function invalidateReviewed(client: QueryClient) {
  for (const key of ['offers', 'seller', 'chats', 'seller-reviews', 'supplier-reviews']) {
    void client.invalidateQueries({ queryKey: [key] })
  }
}

export function handleReviewFailure(
  error: Error,
  target: ReviewTarget | null,
  setTarget: (next: ReviewTarget) => void,
  setEditable: (editable: boolean) => void,
) {
  const cause = error.cause
  if (!isHttpError(cause)) return
  // Отзыв уже написан: сервер называет его идентификатор, и экран переходит к правке
  // вместо второй попытки, которую он отвергнет так же.
  if (cause.errorCode === 'REVIEW_ALREADY_WRITTEN') {
    const written = cause.details?.review_id
    if (typeof written === 'string') setTarget({ ...target, reviewId: written })
  }
  if (cause.errorCode === 'REVIEW_EDIT_WINDOW_CLOSED') setEditable(false)
}
