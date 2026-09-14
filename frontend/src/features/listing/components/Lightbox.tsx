// Полноэкранный просмотр. Закрывается по Escape и по клику вне кадра — на телефоне это
// единственные два жеста, которые человек пробует, не глядя на кнопки.
import { LightboxStage } from './LightboxStage'
import { LightboxStrip } from './LightboxStrip'
import { useLightboxKeys } from '../useLightboxKeys'
import styles from './Lightbox.module.css'

interface LightboxProps {
  photos: string[]
  total: number
  current: number
  onCurrent: (index: number) => void
  onClose: () => void
}

export function Lightbox({ photos, total, current, onCurrent, onClose }: LightboxProps) {
  const step = (delta: number) => onCurrent((current + delta + photos.length) % photos.length)
  useLightboxKeys(onClose, step)

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
      <LightboxStage
        photo={photos[current]}
        caption={`фотография ${current + 1} из ${total}`}
        onStep={step}
      />
      <LightboxStrip photos={photos} current={current} onCurrent={onCurrent} />
    </div>
  )
}
