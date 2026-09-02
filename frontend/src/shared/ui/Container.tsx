import type { ReactNode } from 'react'
import styles from './Container.module.css'

export function Container({
  narrow,
  className,
  children,
}: {
  narrow?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={[styles.wrap, narrow ? styles.narrow : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}
