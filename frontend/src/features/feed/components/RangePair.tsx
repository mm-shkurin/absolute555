// Пара «от — до». Отдельным файлом, потому что в панели их три подряд, и три одинаковых
// блока по восемь строк прячут различия между ними.
import styles from './FilterPanel.module.css'

interface Bound {
  value?: string
  placeholder: string
  disabled?: boolean
  // Локатор для сценариев: поля пары различаются только порядком в разметке, а порядок
  // тест читать не должен.
  testId?: string
}

interface RangeInputProps {
  bound: Bound
  onValue: (value: string) => void
}

function RangeInput({ bound, onValue }: RangeInputProps) {
  return (
    <input
      className={styles.field}
      inputMode="numeric"
      value={bound.value ?? ''}
      placeholder={bound.placeholder}
      disabled={bound.disabled}
      data-testid={bound.testId}
      onChange={(event) => onValue(event.target.value)}
    />
  )
}

interface RangePairProps {
  label: string
  from: Bound
  to: Bound
  onFrom: (value: string) => void
  onTo: (value: string) => void
}

export function RangePair({ label, from, to, onFrom, onTo }: RangePairProps) {
  return (
    <div className={styles.group}>
      <h4>{label}</h4>
      <div className={styles.pair}>
        <RangeInput bound={from} onValue={onFrom} />
        <RangeInput bound={to} onValue={onTo} />
      </div>
    </div>
  )
}
