// Три исхода запроса ленты, кроме успешного: ждём, ничего не нашли, не смогли спросить.
import { Button } from '../../../shared/ui/Button'
import { Placeholder } from '../../../shared/ui/Placeholder'
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

export function EmptyFeed({ filtered, onReset }: { filtered: boolean; onReset: () => void }) {
  return (
    <div className={styles.empty} data-testid="feed-empty">
      <Placeholder className={styles.emptyMark}>пусто</Placeholder>
      <h3>{filtered ? 'Под эти условия машин нет' : 'В этой ленте пока пусто'}</h3>
      <p>
        {filtered
          ? 'Несколько фильтров сразу отсекают почти всё. Уберите цену или карту замеров — подходящих станет заметно больше.'
          : 'Объявления появятся здесь сразу после проверки модератором.'}
      </p>
      {filtered ? <Button onClick={onReset}>Сбросить фильтры</Button> : null}
    </div>
  )
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
