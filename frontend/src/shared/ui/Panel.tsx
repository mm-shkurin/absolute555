import type { ReactNode } from 'react'
import styles from './Panel.module.css'

export function Panel({
  title,
  aside,
  first,
  children,
  testId,
}: {
  title?: string
  aside?: ReactNode
  first?: boolean
  children: ReactNode
  testId?: string
}) {
  return (
    <section
      className={[styles.panel, first ? styles.first : ''].filter(Boolean).join(' ')}
      data-testid={testId}
    >
      {title && aside ? (
        <div className={styles.head}>
          <h3>{title}</h3>
          {aside}
        </div>
      ) : title ? (
        <h3>{title}</h3>
      ) : null}
      {children}
    </section>
  )
}

export function PanelNote({ children }: { children: ReactNode }) {
  return <p className={styles.note}>{children}</p>
}
