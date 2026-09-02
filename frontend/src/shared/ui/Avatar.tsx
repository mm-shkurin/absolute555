// Аватар и подпись с рейтингом — один и тот же блок в своём профиле, в чужом и в отзыве.
import type { ReactNode } from 'react'
import { stars } from '../format/rating'
import styles from './Avatar.module.css'

export function Avatar({ size = 38 }: { size?: number }) {
  return <span className={styles.avatar} style={{ width: size, height: size }} />
}

export function Rating({ rating, children }: { rating: number | null; children?: ReactNode }) {
  return (
    <div className={styles.rating}>
      {stars(rating)} {children ? <span>{children}</span> : null}
    </div>
  )
}

export function PersonHead({
  name,
  rating,
  line,
  action,
  size = 64,
}: {
  name: string
  rating: number | null
  line: string
  action?: ReactNode
  size?: number
}) {
  return (
    <div className={styles.person}>
      <Avatar size={size} />
      <div className={styles.personBody}>
        <div className={styles.name}>{name}</div>
        <Rating rating={rating}>{line}</Rating>
      </div>
      {action}
    </div>
  )
}
