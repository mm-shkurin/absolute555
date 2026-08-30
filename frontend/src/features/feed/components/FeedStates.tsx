// Три исхода запроса ленты, кроме успешного: ждём, ничего не нашли, не смогли спросить.
import { Button, ButtonLink } from '../../../shared/ui/Button'
import { Placeholder } from '../../../shared/ui/Placeholder'
import { ROUTES } from '../../../shared/navigation/routes'
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
  if (filtered) {
    return (
      <div className={styles.empty} data-testid="feed-empty" data-kind="filtered">
        <Placeholder className={styles.emptyMark}>пусто</Placeholder>
        <h3>Под эти условия машин нет</h3>
        <p>
          Несколько фильтров сразу отсекают почти всё. Уберите цену или карту замеров — подходящих
          станет заметно больше.
        </p>
        <Button onClick={onReset}>Сбросить фильтры</Button>
      </div>
    )
  }

  return (
    <div className={styles.empty} data-testid="feed-empty" data-kind="cold">
      <Placeholder className={styles.emptyMark}>01</Placeholder>
      <h3>Объявлений ещё нет</h3>
      <p>
        Площадка только открылась. Первое объявление увидят все, кто зайдёт следом — и оно провисит
        наверху дольше любого другого.
      </p>
      <div className={styles.coldActions}>
        <ButtonLink to={ROUTES.selling}>Разместить первым</ButtonLink>
        <ButtonLink to={ROUTES.home} tone="ghost">
          Как это работает
        </ButtonLink>
      </div>
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
