// Отзыв о сделке: написать или поправить. Два действия за одной кнопкой, потому что для
// человека это одно — «сказать, как прошло».
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { handleReviewFailure, invalidateReviewed, writeReview } from './reviewWrite'

/** Отзыв заработан принятым предложением или перепиской — задан ровно один из двух. */
export interface ReviewTarget {
  offerId?: string
  dialogId?: string
  reviewId: string | null
}

export interface ReviewResult {
  target: ReviewTarget | null
  busy: boolean
  failure: string | null
  editable: boolean
  open: (target: ReviewTarget) => void
  close: () => void
  send: (rating: number, text: string) => void
}

export function useReview(): ReviewResult {
  const client = useQueryClient()
  const [target, setTarget] = useState<ReviewTarget | null>(null)
  const [editable, setEditable] = useState(true)

  const write = useMutation({
    mutationFn: ({ rating, text }: { rating: number; text: string }) =>
      writeReview(target, rating, text),
    onSuccess: () => {
      setTarget(null)
      invalidateReviewed(client)
    },
    onError: (error) => handleReviewFailure(error, target, setTarget, setEditable),
  })

  return {
    target,
    busy: write.isPending,
    failure: (write.error as Error | null)?.message ?? null,
    editable,
    open: (next) => {
      write.reset()
      setEditable(true)
      setTarget(next)
    },
    close: () => setTarget(null),
    send: (rating, text) => write.mutate({ rating, text }),
  }
}
