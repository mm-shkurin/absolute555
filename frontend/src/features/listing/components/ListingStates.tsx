// Ожидание и отказ на карточке. Скелетон повторяет каркас экрана, а не крутит спиннер:
// человек уже знает, куда смотреть, когда придут данные.
import { Button } from '../../../shared/ui/Button'
import styles from './ListingStates.module.css'

export function ListingSkeleton() {
  return (
    <div className={styles.skeleton} data-testid="listing-skeleton">
      <div>
        <div className={`${styles.bar} ${styles.photo}`} />
        <div className={`${styles.bar} ${styles.block}`} />
      </div>
      <div className={`${styles.bar} ${styles.sideBar}`} />
    </div>
  )
}

export function ListingFailure({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.failure} role="alert" data-testid="listing-failure">
      <h3>Объявление не загрузилось</h3>
      <p>{message}</p>
      <Button onClick={onRetry}>Повторить</Button>
    </div>
  )
}
