import styles from './ReviewSheet.module.css'

const RATINGS = [1, 2, 3, 4, 5]

export function RatingPicker({
  rating,
  disabled,
  onPick,
}: {
  rating: number | null
  disabled: boolean
  onPick: (value: number) => void
}) {
  return (
    <div className={styles.ratings}>
      {RATINGS.map((value) => (
        <button
          key={value}
          type="button"
          className={styles.rating}
          aria-pressed={rating === value}
          disabled={disabled}
          onClick={() => onPick(value)}
        >
          {value}
        </button>
      ))}
    </div>
  )
}
