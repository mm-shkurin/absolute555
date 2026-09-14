// Панель проверки. Карточка показана так, как её увидит покупатель, — модератор судит о
// том же, что увидит человек, а не о строках базы.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, buttonClass } from '../../../shared/ui/Button'
import { Cover } from '../../../shared/ui/Cover'
import { ROUTES } from '../../../shared/navigation/routes'
import type { RejectionLabel } from '../../../shared/api/backend/moderationContract'
import type { ReviewCardView } from '../logic/queueView'
import { RejectionForm } from './RejectionForm'
import styles from '../moderation.module.css'

interface ReviewPanelProps {
  card: ReviewCardView
  listingId: string
  busy?: boolean
  readOnly?: boolean
  onPublish: () => void
  onReject: (label: RejectionLabel, comment: string) => void
}

export function ReviewPanel(props: ReviewPanelProps) {
  const [rejecting, setRejecting] = useState(false)
  // Ярлык один: сервер принимает одну причину, и множественный выбор обещал бы продавцу
  // разбор, которого он не получит.
  const [label, setLabel] = useState<RejectionLabel | null>(null)
  const [comment, setComment] = useState('')

  return (
    <aside className={styles.review} data-testid="review-panel">
      <ReviewPreview card={props.card} listingId={props.listingId} />
      <ReviewActions {...props} onToggleReject={() => setRejecting((value) => !value)} />
      {rejecting && !props.readOnly ? (
        <RejectionForm
          label={label}
          comment={comment}
          busy={props.busy}
          onLabel={setLabel}
          onComment={setComment}
          onSubmit={() => label && props.onReject(label, comment)}
          onCancel={() => setRejecting(false)}
        />
      ) : null}
    </aside>
  )
}

function ReviewPreview({ card, listingId }: Pick<ReviewPanelProps, 'card' | 'listingId'>) {
  return (
    <>
      <h3>{card.title}</h3>
      <p className={styles.reviewHint}>Карточка показана так, как её увидит покупатель.</p>
      <Cover url={card.coverUrl} caption="предпросмотр карточки" className={styles.preview} />
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
    </>
  )
}

interface ReviewActionsProps {
  busy?: boolean
  readOnly?: boolean
  onPublish: () => void
  onToggleReject: () => void
}

function ReviewActions({ busy, readOnly, onPublish, onToggleReject }: ReviewActionsProps) {
  return (
    // Разобранное показывается без кнопок: решение уже принято, и повторить его нельзя —
    // сервер отвечает на второе решение отказом, а не тишиной.
    <div className={styles.actions} hidden={readOnly}>
      <Button block disabled={busy} onClick={onPublish}>
        Опубликовать
      </Button>
      <Button tone="ghost" block disabled={busy} onClick={onToggleReject}>
        Отклонить с причиной
      </Button>
    </div>
  )
}
