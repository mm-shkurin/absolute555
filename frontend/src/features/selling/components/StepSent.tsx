// После отправки. Не «спасибо», а что дальше: кто смотрит, сколько ждать и что будет
// при отказе.
import { Button, ButtonLink } from '../../../shared/ui/Button'
import { ROUTES } from '../../../shared/navigation/routes'
import styles from './StepReview.module.css'
import selling from '../selling.module.css'

export function StepSent({ onPreview }: { onPreview: () => void }) {
  return (
    <div className={`${selling.card} ${styles.sent}`} data-testid="step-sent">
      <div className={styles.check}>✓</div>
      <h2>Объявление ушло на проверку</h2>
      <span className={styles.status}>● На модерации</span>
      <p className={selling.sub}>
        Модератор посмотрит карточку так же, как её увидит покупатель. Если что-то не так — вернёт с
        причиной, и вы поправите.
      </p>
      <div className={styles.sentActions}>
        <ButtonLink to={ROUTES.feed} tone="ghost">
          В ленту
        </ButtonLink>
        <Button onClick={onPreview}>Посмотреть, как выглядит</Button>
      </div>
    </div>
  )
}
