import type { ReactNode } from 'react'
import styles from './FormCard.module.css'

export interface FormCardProps {
  title: string
  sub?: string
  children?: ReactNode
  nav: ReactNode
  testId?: string
  /** Без верхнего отступа: карточка стоит в сетке, где отступ задаёт сама сетка. */
  flush?: boolean
}

export function FormCard({ title, sub, children, nav, testId, flush = false }: FormCardProps) {
  return (
    <div className={flush ? `${styles.card} ${styles.flush}` : styles.card} data-testid={testId}>
      <h2>{title}</h2>
      {sub ? <p className={styles.sub}>{sub}</p> : null}
      {children}
      <div className={styles.nav}>{nav}</div>
    </div>
  )
}

export function NavSpacer() {
  return <span className={styles.spacer} />
}

export function NarrowPage({ children }: { children: ReactNode }) {
  return <div className={styles.narrow}>{children}</div>
}
