// Шторка снизу: фильтры, выбор марки, всё, что на телефоне не помещается на месте.
// Закрывается по Escape и по клику вне — два жеста, которые человек пробует не глядя.
import { useEffect, type ReactNode } from 'react'
import styles from './Sheet.module.css'

export function Sheet({
  title,
  onClose,
  children,
  testId,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  testId?: string
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    // Фон под шторкой не прокручивается: иначе палец, промахнувшийся мимо списка,
    // уводит ленту, и человек теряет место, к которому вернётся после фильтра.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

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
    </div>
  )
}
