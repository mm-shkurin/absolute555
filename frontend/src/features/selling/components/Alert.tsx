// Сообщение о том, что пошло не так или требует внимания. Два тона: «поправимо сейчас»
// и «дальше не пустим». Третьего нет — успех в этом продукте показывается результатом,
// а не плашкой о нём.
import type { ReactNode } from 'react'
import styles from './Alert.module.css'

export function Alert({
  tone,
  title,
  spaced,
  children,
}: {
  tone: 'warn' | 'bad'
  title?: string
  spaced?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={[styles.alert, styles[tone], spaced ? styles.spaced : ''].join(' ')}
      role="alert"
    >
      <span className={styles.icon}>{tone === 'bad' ? '✕' : '!'}</span>
      <span>
        {title ? <b>{title}</b> : null}
        {children}
      </span>
    </div>
  )
}
