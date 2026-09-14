// Шторка снизу: фильтры, выбор марки, всё, что на телефоне не помещается на месте.
// Закрывается по Escape и по клику вне — два жеста, которые человек пробует не глядя.
import type { ReactNode } from 'react'
import { useSheetDismissal } from './useSheetDismissal'
import styles from './Sheet.module.css'

interface SheetProps {
  title: string
  onClose: () => void
  children: ReactNode
  testId?: string
}

export function Sheet({ title, onClose, children, testId }: SheetProps) {
  useSheetDismissal(onClose)
  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-testid={testId ?? 'sheet'}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <SheetPanel title={title} onClose={onClose}>
        {children}
      </SheetPanel>
    </div>
  )
}

function SheetPanel({ title, onClose, children }: Omit<SheetProps, 'testId'>) {
  return (
    <div className={styles.sheet}>
      <div className={styles.grip} />
      <div className={styles.head}>
        <span className={styles.title}>{title}</span>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
          ✕
        </button>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  )
}
