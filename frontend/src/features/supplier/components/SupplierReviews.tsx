import { Panel } from '../../../shared/ui/Panel'
import { Avatar } from '../../../shared/ui/Avatar'
import { stars } from '../../../shared/format/rating'
import type { ReviewWire } from '../../../shared/api/backend/reviewContract'
import styles from '../supplier.module.css'

interface SupplierReviewsProps {
  title: string
  reviews: ReviewWire[]
}

export function SupplierReviews({ title, reviews }: SupplierReviewsProps) {
  return (
    <Panel title={title} testId="supplier-reviews">
      {reviews.length === 0 ? (
        <p>Отзывов пока нет — поставщик ещё не закрыл ни одной поставки.</p>
      ) : (
        reviews.map((review) => (
          <div key={review.review_id} className={styles.review}>
            <Avatar size={40} url={review.author?.avatar_url} />
            <div>
              <div className={styles.reviewName}>
                {review.author?.name ?? 'Покупатель'}{' '}
                <span className={styles.reviewStars}>{stars(review.rating)}</span>
              </div>
              <p className={styles.reviewBody}>{review.text}</p>
            </div>
          </div>
        ))
      )}
    </Panel>
  )
}
