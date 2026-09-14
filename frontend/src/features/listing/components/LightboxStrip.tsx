import { Cover } from '../../../shared/ui/Cover'
import styles from './Lightbox.module.css'

interface LightboxStripProps {
  photos: string[]
  current: number
  onCurrent: (index: number) => void
}

export function LightboxStrip({ photos, current, onCurrent }: LightboxStripProps) {
  return (
    <div className={styles.strip}>
      {photos.map((url, index) => (
        <button
          key={url + index}
          type="button"
          className={[styles.stripShot, index === current ? styles.current : ''].join(' ')}
          onClick={() => onCurrent(index)}
        >
          <Cover url={url} caption={String(index + 1)} />
        </button>
      ))}
    </div>
  )
}
