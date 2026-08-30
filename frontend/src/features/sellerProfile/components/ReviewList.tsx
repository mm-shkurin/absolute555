import { Avatar } from '../../../shared/ui/Avatar'
import { stars } from '../../../shared/format/rating'
import type { ReviewView } from '../logic/sellerView'
import styles from '../seller.module.css'

export function ReviewList({ reviews }: { reviews: ReviewView[] }) {
  if (reviews.length === 0) {
    return <p>Отзывов пока нет — этот продавец ещё не закрыл ни одной сделки на площадке.</p>
  }
  return (
    <div data-testid="review-list">
      {reviews.map((review) => (
        <div key={review.id} className={styles.review}>
          <Avatar size={40} />
          <div>
            <div className={styles.reviewHead}>
              {review.author} <span className={styles.reviewStars}>{stars(review.rating)}</span>{' '}
              <span className={styles.reviewMeta}>{review.meta}</span>
            </div>
            <p className={styles.reviewBody}>{review.body}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
