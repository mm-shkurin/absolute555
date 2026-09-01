// Отзыв о состоявшейся сделке: оценка и текст. Оценка обязательна, текст — нет: звёзды
// сравнимы между продавцами, а слова читает один покупатель.
import { useState } from 'react'
import { Sheet } from '../../../shared/ui/Sheet'
import { Button } from '../../../shared/ui/Button'
import styles from '../offers.module.css'

const RATINGS = [1, 2, 3, 4, 5]

export function ReviewSheet({
  title,
  initial,
  busy,
  failure,
  editable,
  onClose,
  onSend,
}: {
  title: string
  initial: { rating: number | null; text: string }
  busy: boolean
  failure: string | null
  /** Окно правки — сутки. Закрытое окно гасит кнопку здесь, а не приезжает отказом. */
  editable: boolean
  onClose: () => void
  onSend: (rating: number, text: string) => void
}) {
  const [rating, setRating] = useState<number | null>(initial.rating)
  const [text, setText] = useState(initial.text)

  return (
    <Sheet title={title} onClose={onClose} testId="review-sheet">
      <div className={styles.ratings}>
        {RATINGS.map((value) => (
          <button
            key={value}
            type="button"
            className={styles.rating}
            aria-pressed={rating === value}
            disabled={busy || !editable}
            onClick={() => setRating(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <textarea
        className={styles.reviewText}
        value={text}
        maxLength={2000}
        disabled={busy || !editable}
        onChange={(event) => setText(event.target.value)}
        placeholder="Что было с этой сделкой. Текст увидят все, кто откроет профиль продавца."
      />
      {failure ? <p className={styles.reviewFailure}>{failure}</p> : null}
      {editable ? null : (
        <p className={styles.reviewFailure}>
          Сутки на правку прошли — отзыв больше не меняется.
        </p>
      )}
      <Button
        block
        disabled={busy || !editable || rating === null}
        onClick={() => rating !== null && onSend(rating, text)}
      >
        {initial.rating === null ? 'Оставить отзыв' : 'Сохранить'}
      </Button>
    </Sheet>
  )
}
