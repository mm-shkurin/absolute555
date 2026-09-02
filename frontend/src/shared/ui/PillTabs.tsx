// Переключатель разделов внутри страницы. Счётчик в подписи, а не отдельным значком:
// «Мне прислали · 3» читается одним движением глаза, значок требует второго.
import styles from './PillTabs.module.css'

export interface Tab<T extends string> {
  id: T
  label: string
  count?: number
}

export function PillTabs<T extends string>({
  tabs,
  current,
  onSelect,
}: {
  tabs: Tab<T>[]
  current: T
  onSelect: (id: T) => void
}) {
  return (
    <div className={styles.tabs} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={styles.tab}
          aria-pressed={tab.id === current}
          onClick={() => onSelect(tab.id)}
        >
          {tab.count === undefined ? tab.label : `${tab.label} · ${tab.count}`}
        </button>
      ))}
    </div>
  )
}
