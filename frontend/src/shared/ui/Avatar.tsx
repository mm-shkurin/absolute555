// Аватар и подпись с рейтингом — один и тот же блок в своём профиле, в чужом и в отзыве.
import type { ReactNode } from 'react'
import { stars } from '../format/rating'
import styles from './Avatar.module.css'

export function Avatar({ size = 38, url }: { size?: number; url?: string | null }) {
  // Без фотографии — тот же серый круг, что и раньше: буква или инициалы читаются как
  // содержимое профиля, а это заглушка.
  if (!url) {
    return (
      <span
        className={styles.avatar}
        style={{ width: size, height: size }}
        data-testid="person-avatar"
      />
    )
  }
  return (
    <img
      className={styles.avatar}
      style={{ width: size, height: size }}
      src={url}
      alt=""
      data-testid="person-avatar"
    />
  )
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
  avatarUrl,
}: {
  name: string
  rating: number | null
  line: string
  action?: ReactNode
  size?: number
  avatarUrl?: string | null
}) {
  return (
    <div className={styles.person}>
      <Avatar size={size} url={avatarUrl} />
      <div className={styles.personBody}>
        <div className={styles.name} data-testid="person-name">
          {name}
        </div>
        <Rating rating={rating}>{line}</Rating>
      </div>
      {action}
    </div>
  )
}
