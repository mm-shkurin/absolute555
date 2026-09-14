// Полноэкранный просмотр. Закрывается по Escape и по клику вне кадра — на телефоне это
// единственные два жеста, которые человек пробует, не глядя на кнопки.
import { useEffect, useRef } from 'react'
import { browserWindow } from '../../../shared/lib/browser'
import { Cover } from '../../../shared/ui/Cover'
import { swipeStep } from '../logic/gallerySwipe'
import styles from './Lightbox.module.css'

interface Props {
  photos: string[]
  total: number
  current: number
  onCurrent: (index: number) => void
  onClose: () => void
}

export function Lightbox({ photos, total, current, onCurrent, onClose }: Props) {
  const step = (delta: number) => onCurrent((current + delta + photos.length) % photos.length)
  const from = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') step(1)
      if (event.key === 'ArrowLeft') step(-1)
    }
    const win = browserWindow()
    win?.addEventListener('keydown', onKey)
    return () => win?.removeEventListener('keydown', onKey)
  })

  return (
    <div className={styles.lightbox} role="dialog" aria-modal="true" data-testid="lightbox">
      <div className={styles.lightboxTop}>
        <span>
          {current + 1} из {total}
        </span>
        <span className={styles.spacer} />
        <button type="button" className={styles.round} onClick={onClose} aria-label="Закрыть">
          ✕
        </button>
      </div>
      <div
        className={styles.stage}
        onPointerDown={(event) => {
          from.current = { x: event.clientX, y: event.clientY }
        }}
        onPointerUp={(event) => {
          const start = from.current
          from.current = null
          if (!start) return
          const by = swipeStep(event.clientX - start.x, event.clientY - start.y)
          if (by !== 0) step(by)
        }}
        onPointerCancel={() => {
          from.current = null
        }}
      >
        <button
          type="button"
          className={styles.round}
          onClick={() => step(-1)}
          aria-label="Предыдущее фото"
        >
          ‹
        </button>
        <Cover
          url={photos[current]}
          caption={`фотография ${current + 1} из ${total}`}
          className={styles.stageShot}
        />
        <button
          type="button"
          className={styles.round}
          onClick={() => step(1)}
          aria-label="Следующее фото"
        >
          ›
        </button>
      </div>
      <div className={styles.strip}>
        {photos.map((url, index) => (
          <button
            key={url + index}
            type="button"
            className={[styles.stripShot, index === current ? styles.current : ""].join(" ")}
            onClick={() => onCurrent(index)}
          >
            <Cover url={url} caption={String(index + 1)} />
          </button>
        ))}
      </div>
    </div>
  )
}
