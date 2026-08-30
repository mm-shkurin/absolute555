// Панель проверки. Карточка показана так, как её увидит покупатель, — модератор судит о
// том же, что увидит человек, а не о строках базы.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, buttonClass } from '../../../shared/ui/Button'
import { Placeholder } from '../../../shared/ui/Placeholder'
import { ROUTES } from '../../../shared/navigation/routes'
import { REJECTION_REASONS, type ReviewCardView } from '../logic/queueView'
import styles from '../moderation.module.css'

export function ReviewPanel({
  card,
  listingId,
  onPublish,
  onReject,
}: {
  card: ReviewCardView
  listingId: string
  onPublish: () => void
  onReject: (reasons: string[], comment: string) => void
}) {
  const [rejecting, setRejecting] = useState(false)
  const [reasons, setReasons] = useState<string[]>([])
  const [comment, setComment] = useState('')

  const toggle = (reason: string) =>
    setReasons((current) =>
      current.includes(reason) ? current.filter((item) => item !== reason) : [...current, reason],
    )

  return (
    <aside className={styles.review} data-testid="review-panel">
      <h3>{card.title}</h3>
      <p className={styles.reviewHint}>Карточка показана так, как её увидит покупатель.</p>
      <Placeholder className={styles.preview}>предпросмотр карточки</Placeholder>
      <Link to={ROUTES.listing(listingId)} className={buttonClass({ tone: 'ghost', block: true })}>
        Открыть целиком
      </Link>

      <div className={styles.facts}>
        {card.facts.map((fact) => (
          <div key={fact.label}>
            <span>{fact.label}</span>
            <b className={fact.mono ? styles.mono : undefined}>{fact.value}</b>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <Button block onClick={onPublish}>
          Опубликовать
        </Button>
        <Button tone="ghost" block onClick={() => setRejecting((value) => !value)}>
          Отклонить с причиной
        </Button>
      </div>

      {rejecting ? (
        <div className={styles.rejection} data-testid="rejection-form">
          <div className={styles.label}>Причина отклонения — обязательна</div>
          <div className={styles.chips}>
            {REJECTION_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                className={styles.chip}
                aria-pressed={reasons.includes(reason)}
                onClick={() => toggle(reason)}
              >
                {reason}
              </button>
            ))}
          </div>
          <textarea
            className={styles.reason}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Что именно поправить. Текст увидит продавец."
          />
          <div className={styles.actions}>
            <Button
              block
              disabled={reasons.length === 0}
              onClick={() => onReject(reasons, comment)}
            >
              Отклонить и отправить причину
            </Button>
            <Button tone="ghost" block onClick={() => setRejecting(false)}>
              Отмена
            </Button>
          </div>
        </div>
      ) : null}
    </aside>
  )
}
