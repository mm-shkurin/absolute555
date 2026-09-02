import type { ReactNode } from 'react'
import styles from './FormCard.module.css'

export function FormCard({
  title,
  sub,
  children,
  nav,
  testId,
}: {
  title: string
  sub?: string
  children: ReactNode
  nav: ReactNode
  testId?: string
}) {
  return (
    <div className={styles.card} data-testid={testId}>
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
