// Форма отзыва. Появляется только у того, чьё предложение продавец принял: право считает
// сервер, экран лишь объясняет, за какую сделку ставится оценка.
import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Panel, PanelNote } from '../../../shared/ui/Panel'
import type { ReviewInvitation } from '../logic/sellerView'
import styles from '../seller.module.css'

export function ReviewForm({
  invitation,
  onSubmit,
}: {
  invitation: ReviewInvitation
  onSubmit: (rating: number, body: string) => void
}) {
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')

  if (!invitation.allowed) {
    return (
      <Panel title="Отзывы" first testId="review-locked">
        <PanelNote>{invitation.explanation}</PanelNote>
      </Panel>
    )
  }

  return (
    <Panel
      title={invitation.editing ? 'Изменить отзыв' : 'Оставить отзыв'}
      first
      testId="review-form"
    >
      <p className={styles.reviewBody}>{invitation.explanation}</p>
      <div className={styles.rate}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className={value <= rating ? styles.on : undefined}
            onClick={() => setRating(value)}
            aria-label={`Оценка ${value}`}
            aria-pressed={value === rating}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className={styles.reviewField}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Что было хорошо, что нет. Совпало ли состояние с описанием."
      />
      <Button block onClick={() => onSubmit(rating, body)} disabled={body.trim().length === 0}>
        {invitation.editing ? 'Сохранить отзыв' : 'Отправить отзыв'}
      </Button>
      <p className={styles.fine}>
        Отзыв публикуется от вашего имени и его нельзя удалить — только отредактировать.
      </p>
    </Panel>
  )
}
