// Три исхода запроса ленты, кроме успешного: ждём, ничего не нашли, не смогли спросить.
import { Button } from '../../../shared/ui/Button'
import { ColdEmpty, FilteredEmpty } from './EmptyFeedViews'
import styles from './FeedStates.module.css'

export function FeedSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={styles.skeletons} data-testid="feed-skeleton">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={styles.skeleton}>
          <div className={`${styles.bar} ${styles.barPhoto}`} />
          <div className={styles.skeletonBody}>
            <div className={`${styles.bar} ${styles.barTitle}`} />
            <div className={`${styles.bar} ${styles.barPrice}`} />
            <div className={`${styles.bar} ${styles.barSpec}`} />
          </div>
        </div>
      ))}
    </div>
  )
}

// Пустая лента бывает двух видов, и это разные разговоры. Отсекли фильтрами — надо
// ослабить условия. Пусто без фильтров — площадка только открылась, и человеку предлагают
// не ждать, а разместиться первым: первое объявление увидят все, кто зайдёт следом.
export function EmptyFeed({ filtered, onReset }: { filtered: boolean; onReset: () => void }) {
  return filtered ? <FilteredEmpty onReset={onReset} /> : <ColdEmpty />
}

export function FeedFailure({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.empty} data-testid="feed-failure" role="alert">
      <h3>Лента не загрузилась</h3>
      <p>{message}</p>
      <Button onClick={onRetry}>Повторить</Button>
    </div>
  )
}
