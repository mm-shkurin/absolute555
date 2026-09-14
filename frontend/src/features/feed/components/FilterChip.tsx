import type { ReactNode } from 'react'
import styles from './FilterPanel.module.css'

interface FilterChipProps {
  pressed?: boolean
  onClick?: () => void
  children: ReactNode
}

export function FilterChip({ pressed, onClick, children }: FilterChipProps) {
  return (
    <button type="button" className={styles.chip} aria-pressed={pressed} onClick={onClick}>
      {children}
    </button>
  )
}
