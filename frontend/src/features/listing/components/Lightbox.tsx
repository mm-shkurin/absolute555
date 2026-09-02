// Полноэкранный просмотр. Закрывается по Escape и по клику вне кадра — на телефоне это
// единственные два жеста, которые человек пробует, не глядя на кнопки.
import { useEffect } from 'react'
import { Placeholder } from '../../../shared/ui/Placeholder'
import { Shot } from './Gallery'
import styles from './Gallery.module.css'

interface Props {
  photos: string[]
  total: number
  current: number
  onCurrent: (index: number) => void
  onClose: () => void
}

export function Lightbox({ photos, total, current, onCurrent, onClose }: Props) {
  const step = (delta: number) => onCurrent((current + delta + photos.length) % photos.length)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') step(1)
      if (event.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
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
      <div className={styles.stage}>
        <button
          type="button"
          className={styles.round}
          onClick={() => step(-1)}
          aria-label="Предыдущее фото"
        >
          ‹
        </button>
        <Placeholder className={styles.stageShot}>
          <Shot url={photos[current]} caption={`фотография ${current + 1} из ${total}`} />
        </Placeholder>
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
            className={[styles.stripShot, index === current ? styles.current : ''].join(' ')}
            onClick={() => onCurrent(index)}
          >
            <Shot url={url} caption={String(index + 1)} />
          </button>
        ))}
      </div>
    </div>
  )
}
