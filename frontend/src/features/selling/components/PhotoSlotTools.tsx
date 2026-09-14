import { ShiftButton } from './ShiftButton'
import styles from './StepPhotos.module.css'

export interface PhotoSlotToolsProps {
  index: number
  count: number
  busy: boolean
  onMove: (from: number, to: number) => void
}

export function PhotoSlotTools({ index, count, busy, onMove }: PhotoSlotToolsProps) {
  return (
    <div className={styles.tools}>
      <ShiftButton
        label={`Сдвинуть фото ${index + 1} влево`}
        disabled={busy || index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        ←
      </ShiftButton>
      {index > 0 ? (
        <button
          type="button"
          className={styles.makeCover}
          onClick={() => onMove(index, 0)}
          disabled={busy}
          data-testid="photo-make-cover"
        >
          обложка
        </button>
      ) : null}
      <ShiftButton
        label={`Сдвинуть фото ${index + 1} вправо`}
        disabled={busy || index === count - 1}
        onClick={() => onMove(index, index + 1)}
      >
        →
      </ShiftButton>
    </div>
  )
}
