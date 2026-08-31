// Панель проверки. Карточка показана так, как её увидит покупатель, — модератор судит о
// том же, что увидит человек, а не о строках базы.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, buttonClass } from '../../../shared/ui/Button'
import { Placeholder } from '../../../shared/ui/Placeholder'
import { ROUTES } from '../../../shared/navigation/routes'
import { REJECTION_REASONS } from '../../../shared/domain/moderationReasons'
import type { RejectionLabel } from '../../../shared/api/backend/moderationContract'
import type { ReviewCardView } from '../logic/queueView'
import styles from '../moderation.module.css'

export function ReviewPanel({
  card,
  listingId,
  busy,
  readOnly,
  onPublish,
  onReject,
}: {
  card: ReviewCardView
  listingId: string
  busy?: boolean
  readOnly?: boolean
  onPublish: () => void
  onReject: (label: RejectionLabel, comment: string) => void
}) {
  const [rejecting, setRejecting] = useState(false)
  // Ярлык один: сервер принимает одну причину, и множественный выбор обещал бы продавцу
  // разбор, которого он не получит.
  const [label, setLabel] = useState<RejectionLabel | null>(null)
  const [comment, setComment] = useState('')

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

      {/* Разобранное показывается без кнопок: решение уже принято, и повторить его
          нельзя — сервер отвечает на второе решение отказом, а не тишиной. */}
      <div className={styles.actions} hidden={readOnly}>
        <Button block disabled={busy} onClick={onPublish}>
          Опубликовать
        </Button>
        <Button tone="ghost" block disabled={busy} onClick={() => setRejecting((value) => !value)}>
          Отклонить с причиной
        </Button>
      </div>

      {rejecting && !readOnly ? (
        <div className={styles.rejection} data-testid="rejection-form">
          <div className={styles.label}>Причина отклонения — обязательна</div>
          <div className={styles.chips}>
            {REJECTION_REASONS.map((reason) => (
              <button
                key={reason.value}
                type="button"
                className={styles.chip}
                aria-pressed={label === reason.value}
                onClick={() => setLabel(reason.value)}
              >
                {reason.text}
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
            <Button block disabled={busy || label === null} onClick={() => label && onReject(label, comment)}>
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
