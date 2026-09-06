// Галерея: крупный кадр, лента миниатюр, полноэкранный просмотр по щелчку.
//
// Кадр листается прямо здесь — стрелками, жестом и клавишами. До этого сменить его можно
// было только щелчком по миниатюре: на телефоне они мелкие, а стрелок не было вовсе, и
// человек листал галерею, открыв полноэкранный просмотр ради каждого кадра.
import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Lightbox } from './Lightbox'
import { Placeholder } from '../../../shared/ui/Placeholder'
import { Cover } from '../../../shared/ui/Cover'
import { nextIndex, swipeStep } from '../logic/gallerySwipe'
import styles from './Gallery.module.css'

const THUMBS_SHOWN = 6

export function Gallery({ photos, total }: { photos: string[]; total: number }) {
  const [current, setCurrent] = useState(0)
  const [open, setOpen] = useState(false)
  // Точка нажатия: от неё считается жест. В ref, а не в состоянии — перерисовывать
  // галерею на каждое движение пальца незачем.
  const from = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)

  // Шесть мест под миниатюры: в последнем стоит «ещё N», если кадров больше.
  const visible = photos.slice(0, THUMBS_SHOWN)
  const rest = total - visible.length
  const step = (by: number) => setCurrent((index) => nextIndex(index, by, photos.length))

  const grab = (event: ReactPointerEvent) => {
    from.current = { x: event.clientX, y: event.clientY }
    swiped.current = false
  }

  const release = (event: ReactPointerEvent) => {
    const start = from.current
    from.current = null
    if (!start) return
    const by = swipeStep(event.clientX - start.x, event.clientY - start.y)
    if (by === 0) return
    // Жест засчитан — значит это листание, а не нажатие: полноэкранный просмотр по
    // окончании свайпа открываться не должен.
    swiped.current = true
    step(by)
  }

  return (
    <div data-testid="gallery">
      <div className={styles.frame}>
        <button
          type="button"
          className={styles.main}
          onClick={() => {
            if (!swiped.current) setOpen(true)
          }}
          onPointerDown={grab}
          onPointerUp={release}
          onPointerCancel={() => {
            from.current = null
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') step(1)
            if (event.key === 'ArrowLeft') step(-1)
          }}
        >
          <Cover url={photos[current]} caption={`фотография ${current + 1} из ${total}`} />
        </button>
        {photos.length > 1 ? (
          <>
            <button
              type="button"
              className={`${styles.arrow} ${styles.prev}`}
              onClick={() => step(-1)}
              aria-label="Предыдущий кадр"
              data-testid="gallery-prev"
            >
              ‹
            </button>
            <button
              type="button"
              className={`${styles.arrow} ${styles.next}`}
              onClick={() => step(1)}
              aria-label="Следующий кадр"
              data-testid="gallery-next"
            >
              ›
            </button>
          </>
        ) : null}
      </div>
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
