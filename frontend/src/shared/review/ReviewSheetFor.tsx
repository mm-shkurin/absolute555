import { ReviewSheet } from './ReviewSheet'
import type { ReviewResult } from './useReview'

export function ReviewSheetFor({ review, newTitle }: { review: ReviewResult; newTitle: string }) {
  if (!review.target) return null
  return (
    <ReviewSheet
      title={review.target.reviewId ? 'Изменить отзыв' : newTitle}
      initial={{ rating: null, text: '' }}
      busy={review.busy}
      failure={review.failure}
      editable={review.editable}
      onClose={review.close}
      onSend={review.send}
    />
  )
}
