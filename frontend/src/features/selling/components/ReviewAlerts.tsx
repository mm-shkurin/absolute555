import { Alert } from './Alert'
import styles from './StepReview.module.css'

export interface ReviewAlertsProps {
  error?: string | null
  gaps: string[]
  unmeasured: number
  onFillThickness: () => void
}

export function ReviewAlerts({ error, gaps, unmeasured, onFillThickness }: ReviewAlertsProps) {
  return (
    <>
      {error ? (
        <Alert tone="bad" title="Объявление не отправлено" spaced>
          {error}
        </Alert>
      ) : null}
      {gaps.length > 0 ? (
        <Alert tone="bad" title="Без этого объявление не отправить" spaced>
          Не заполнено: {gaps.join(', ')}.
        </Alert>
      ) : null}
      {unmeasured > 0 ? (
        <Alert tone="warn" spaced>
          Не замерено панелей: {unmeasured} — бейджа «полная карта» не будет.{' '}
          <button type="button" onClick={onFillThickness} className={styles.link}>
            Домерить
          </button>{' '}
          можно и после публикации.
        </Alert>
      ) : null}
    </>
  )
}
