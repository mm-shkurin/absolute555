// Выбор одной причины из готового списка. Появляется трижды — отклонение черновика, снятие
// с публикации, жалоба покупателя, — и правило везде одно: причин пять, выбирается одна, и
// без неё действие недоступно.
import styles from './ReasonPicker.module.css'

export function ReasonPicker<T extends string>({
  options,
  current,
  disabled,
  testId,
  onPick,
}: {
  options: readonly { value: T; text: string }[]
  current: T | null
  disabled?: boolean
  testId?: string
  onPick: (value: T) => void
}) {
  return (
    <div className={styles.chips} data-testid={testId}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.chip}
          aria-pressed={current === option.value}
          disabled={disabled}
          onClick={() => onPick(option.value)}
        >
          {option.text}
        </button>
      ))}
    </div>
  )
}
