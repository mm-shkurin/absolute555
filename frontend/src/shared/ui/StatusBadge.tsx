import styles from './StatusBadge.module.css'

export type StatusTone = 'wait' | 'ok' | 'bad' | 'past' | 'info'

// Точка перед текстом — у того, что продолжается: «ждёт ответа», «на модерации».
// Завершённое состояние её не получает.
const LIVE = new Set<StatusTone>(['wait'])

export function StatusBadge({ tone, children }: { tone: StatusTone; children: string }) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`} data-tone={tone}>
      {LIVE.has(tone) ? '●' : null}
      {children}
    </span>
  )
}
