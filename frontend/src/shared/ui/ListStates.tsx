// Три исхода любого списка в личных разделах. Один набор на приложение: «пусто» и «не
// загрузилось» должны выглядеть одинаково в офферах, чатах и объявлениях — иначе человек
// решает, что попал в другое место.
import type { ReactNode } from 'react'
import { Button } from './Button'
import styles from './ListStates.module.css'

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className={styles.rows} data-testid="list-skeleton">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className={styles.rowBar} />
      ))}
    </div>
  )
}

export function EmptyNotice({
  title,
  children,
  action,
}: {
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className={styles.notice} data-testid="list-empty">
      <h3>{title}</h3>
      {children ? <p>{children}</p> : null}
      {action}
    </div>
  )
}

export function FailureNotice({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.notice} role="alert" data-testid="list-failure">
      <h3>Не загрузилось</h3>
      <p>{message}</p>
      <Button onClick={onRetry}>Повторить</Button>
    </div>
  )
}
