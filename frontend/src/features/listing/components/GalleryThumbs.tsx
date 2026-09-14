import { Cover } from '../../../shared/ui/Cover'
import { Placeholder } from '../../../shared/ui/Placeholder'
import styles from './Gallery.module.css'

const THUMBS_SHOWN = 6

interface GalleryThumbsProps {
  photos: string[]
  total: number
  current: number
  onPick: (index: number) => void
}

export function GalleryThumbs({ photos, total, current, onPick }: GalleryThumbsProps) {
  // Шесть мест под миниатюры: в последнем стоит «ещё N», если кадров больше.
  const visible = photos.slice(0, THUMBS_SHOWN)
  const rest = total - visible.length
  return (
    <div className={styles.thumbs}>
      {visible.map((url, index) => (
        <button
          key={url + index}
          type="button"
          className={[styles.thumb, index === current ? styles.current : ''].join(' ')}
          onClick={() => onPick(index)}
        >
          <Cover url={url} caption={String(index + 1)} />
        </button>
      ))}
      {rest > 0 ? <Placeholder className={styles.thumb}>{`+${rest}`}</Placeholder> : null}
    </div>
  )
}
