import type { CSSProperties, ReactNode } from 'react'
import styles from './Placeholder.module.css'

export function Placeholder({
  children,
  style,
  className,
}: {
  children: ReactNode
  style?: CSSProperties
  className?: string
}) {
  return (
    <div className={[styles.placeholder, className ?? ''].filter(Boolean).join(' ')} style={style}>
      {children}
    </div>
  )
}
