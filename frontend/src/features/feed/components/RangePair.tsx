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

export function RangePair({
  label,
  from,
  to,
  onFrom,
  onTo,
}: {
  label: string
  from: Bound
  to: Bound
  onFrom: (value: string) => void
  onTo: (value: string) => void
}) {
  return (
    <div className={styles.group}>
      <h4>{label}</h4>
      <div className={styles.pair}>
        <input
          className={styles.field}
          inputMode="numeric"
          value={from.value ?? ''}
          placeholder={from.placeholder}
          disabled={from.disabled}
          data-testid={from.testId}
          onChange={(event) => onFrom(event.target.value)}
        />
        <input
          className={styles.field}
          inputMode="numeric"
          value={to.value ?? ''}
          placeholder={to.placeholder}
          disabled={to.disabled}
          data-testid={to.testId}
          onChange={(event) => onTo(event.target.value)}
        />
      </div>
    </div>
  )
}
