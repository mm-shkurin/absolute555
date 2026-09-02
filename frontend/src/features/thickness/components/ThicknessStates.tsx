import { Button } from '../../../shared/ui/Button'
import styles from './ThicknessStates.module.css'

export function ThicknessSkeleton() {
  return (
    <div className={styles.skeleton} data-testid="thickness-skeleton">
      <div className={`${styles.bar} ${styles.sheet}`} />
      <div className={`${styles.bar} ${styles.side}`} />
    </div>
  )
}

export function ThicknessFailure({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.failure} role="alert" data-testid="thickness-failure">
      <h3>Карта замеров не загрузилась</h3>
      <p>{message}</p>
      <Button onClick={onRetry}>Повторить</Button>
    </div>
  )
}
