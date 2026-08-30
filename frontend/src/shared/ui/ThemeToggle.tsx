// Переключатель темы. Три положения, а не два: «система» — это отсутствие выбора, и
// вернуться к ней после ручного переключения иначе было бы нечем.
import { useSyncExternalStore } from 'react'
import { setTheme, subscribeToTheme, themeChoice, type ThemeChoice } from '../theme/themeStore'
import styles from './ThemeToggle.module.css'

const OPTIONS: { id: ThemeChoice; label: string; title: string }[] = [
  { id: 'light', label: '☀', title: 'Светлая тема' },
  { id: 'dark', label: '☾', title: 'Тёмная тема' },
  { id: 'system', label: 'A', title: 'Как в системе' },
]

export function ThemeToggle() {
  const choice = useSyncExternalStore(subscribeToTheme, themeChoice, () => 'system' as ThemeChoice)

  return (
    <div className={styles.toggle} data-testid="theme-toggle">
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          className={styles.option}
          aria-pressed={choice === option.id}
          title={option.title}
          aria-label={option.title}
          onClick={() => setTheme(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
