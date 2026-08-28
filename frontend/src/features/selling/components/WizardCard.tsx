// Обёртка шага: заголовок, подзаголовок, содержимое и полоса навигации внизу.
import type { ReactNode } from 'react'
import styles from '../selling.module.css'

export function WizardCard({
  title,
  sub,
  children,
  nav,
  testId,
}: {
  title: string
  sub?: string
  children?: ReactNode
  nav: ReactNode
  testId: string
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
