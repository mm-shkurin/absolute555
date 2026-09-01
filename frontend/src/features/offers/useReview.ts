// Отзыв о сделке: написать или поправить. Два действия за одной кнопкой, потому что для
// человека это одно — «сказать, как прошло».
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createReview, updateReview } from '../../shared/api/backend/reviewApi'
import { isHttpError } from '../../shared/api/httpClient'

export interface ReviewTarget {
  offerId: string
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
    mutationFn: ({ rating, text }: { rating: number; text: string }) => {
      const body = text.trim() ? { rating, text: text.trim() } : { rating }
      return target?.reviewId
        ? updateReview(target.reviewId, body)
        : createReview(target?.offerId ?? '', body)
    },
    onSuccess: () => {
      setTarget(null)
      // Отзыв меняет агрегат продавца, а он едет в каждом блоке seller: перечитываются
      // и офферы, и всё, где этот блок нарисован.
      void client.invalidateQueries({ queryKey: ['offers'] })
      void client.invalidateQueries({ queryKey: ['seller'] })
    },
    onError: (error) => {
      const cause = (error as Error).cause
      if (!isHttpError(cause)) return
      // Отзыв уже написан: сервер называет его идентификатор, и экран переходит к правке
      // вместо второй попытки, которую он отвергнет так же.
      if (cause.errorCode === 'REVIEW_ALREADY_WRITTEN') {
        const written = cause.details?.review_id
        if (typeof written === 'string') setTarget({ offerId: target?.offerId ?? '', reviewId: written })
      }
      if (cause.errorCode === 'REVIEW_EDIT_WINDOW_CLOSED') setEditable(false)
    },
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
