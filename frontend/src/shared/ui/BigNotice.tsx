import type { ReactNode } from 'react'
import styles from './BigNotice.module.css'

export function BigNotice({
  icon,
  tone = 'accent',
  title,
  children,
  actions,
  fine,
}: {
  icon: ReactNode
  tone?: 'accent' | 'bad'
  title: string
  children: ReactNode
  actions?: ReactNode
  fine?: string
}) {
  return (
    <div className={styles.notice} data-testid="big-notice">
      <div className={[styles.icon, tone === 'bad' ? styles.bad : ''].join(' ')}>{icon}</div>
      <h2>{title}</h2>
      <p>{children}</p>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
      {fine ? <p className={styles.fine}>{fine}</p> : null}
    </div>
  )
}

export function Spinner() {
  return <span className={styles.spinner} />
}
