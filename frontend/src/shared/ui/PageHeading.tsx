// Шапка личного раздела: заголовок, подпись и место под одно действие справа.
import type { ReactNode } from 'react'
import styles from './PageHeading.module.css'

export function PageSection({ children }: { children: ReactNode }) {
  return <div className={styles.page}>{children}</div>
}

export function PageHeading({
  title,
  sub,
  action,
}: {
  title: string
  sub?: string
  action?: ReactNode
}) {
  return (
    <div className={styles.head}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        {sub ? <p className={styles.sub}>{sub}</p> : null}
      </div>
      {action ? (
        <>
          <span className={styles.spacer} />
          {action}
        </>
      ) : null}
    </div>
  )
}
