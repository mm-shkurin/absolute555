// Обложка объявления: адрес есть — картинка, нет — серая плашка. Развилка одна на
// все списки, поэтому живёт здесь: пять экранов рисовали плашку всегда, потому что
// каждый заводил её у себя.
import { Placeholder } from './Placeholder'
import styles from './Cover.module.css'

export function Cover({
  url,
  caption,
  className,
}: {
  url?: string | null
  caption: string
  className?: string
}) {
  if (!url) return <Placeholder className={className}>{caption}</Placeholder>
  return (
    <img
      className={[styles.cover, className ?? ''].filter(Boolean).join(' ')}
      src={url}
      alt={caption}
    />
  )
}
