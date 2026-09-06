// Галерея: крупный кадр, лента миниатюр, полноэкранный просмотр по щелчку.
import { useState } from 'react'
import { Lightbox } from './Lightbox'
import { Placeholder } from '../../../shared/ui/Placeholder'
import { Cover } from '../../../shared/ui/Cover'
import styles from './Gallery.module.css'

const THUMBS_SHOWN = 6

export function Gallery({ photos, total }: { photos: string[]; total: number }) {
  const [current, setCurrent] = useState(0)
  const [open, setOpen] = useState(false)
  // Шесть мест под миниатюры: в последнем стоит «ещё N», если кадров больше.
  const visible = photos.slice(0, THUMBS_SHOWN)
  const rest = total - visible.length

  return (
    <div data-testid="gallery">
      <button type="button" className={styles.main} onClick={() => setOpen(true)}>
        <Cover url={photos[current]} caption={`фотография ${current + 1} из ${total}`} />
      </button>
      <div className={styles.thumbs}>
        {visible.map((url, index) => (
          <button
            key={url + index}
            type="button"
            className={[styles.thumb, index === current ? styles.current : ''].join(' ')}
            onClick={() => setCurrent(index)}
          >
            <Cover url={url} caption={String(index + 1)} />
          </button>
        ))}
        {rest > 0 ? <Placeholder className={styles.thumb}>{`+${rest}`}</Placeholder> : null}
      </div>
      {open ? (
        <Lightbox
          photos={photos}
          total={total}
          current={current}
          onCurrent={setCurrent}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  )
}
