import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../shared/navigation/routes'
import type { useReview } from '../../shared/review/useReview'
import type { OfferAction } from './logic/offerRows'
import type { OffersResult } from './useOffers'

export type OfferActionHandler = (action: OfferAction['id'], offerId: string) => void

// Строки мемоизированы, поэтому обработчик обязан быть стабильным: он читает свежие строки
// и отзыв через ссылку, а не через замыкание текущего рендера.
export function useOfferActions(
  offers: OffersResult,
  review: ReturnType<typeof useReview>,
): OfferActionHandler {
  const navigate = useNavigate()
  const latest = useRef<OfferActionHandler>(() => undefined)

  useEffect(() => {
    latest.current = (action, offerId) => {
      if (action === 'chat' || action === 'message') return void navigate(ROUTES.chats)
      const offer = offers.rows.find((row) => row.id === offerId)
      if (action === 'review' && offer) return review.open({ offerId, reviewId: offer.reviewId })
      if (action === 'accept' || action === 'reject' || action === 'withdraw') {
        offers.decide(action, offerId)
      }
    }
  })

  return useCallback<OfferActionHandler>((action, offerId) => latest.current(action, offerId), [])
}
