import type { ReactNode } from 'react'
import styles from './Panel.module.css'

interface PanelProps {
  title?: string
  aside?: ReactNode
  first?: boolean
  /** Рамкой акцента выделяется поверхность, которой у большинства людей нет вовсе —
   *  вход в кабинет модератора. Отступы при этом остаются панельными. */
  tone?: 'accent'
  children: ReactNode
  testId?: string
}

export function Panel({ title, aside, first, tone, children, testId }: PanelProps) {
  const className = [styles.panel, first ? styles.first : '', tone ? styles.accent : '']
    .filter(Boolean)
    .join(' ')
  return (
    <section className={className} data-testid={testId}>
      <PanelTitle title={title} aside={aside} />
      {children}
    </section>
  )
}

function PanelTitle({ title, aside }: { title?: string; aside?: ReactNode }) {
  if (!title) return null
  if (!aside) return <h3>{title}</h3>
  return (
    <div className={styles.head}>
      <h3>{title}</h3>
      {aside}
    </div>
  )
}

export function PanelNote({ children }: { children: ReactNode }) {
  return <p className={styles.note}>{children}</p>
}
