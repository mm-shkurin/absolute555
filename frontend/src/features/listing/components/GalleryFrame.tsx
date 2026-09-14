import { Cover } from '../../../shared/ui/Cover'
import { GalleryArrows } from './GalleryArrows'
import { usePointerSwipe } from '../usePointerSwipe'
import styles from './Gallery.module.css'

interface GalleryFrameProps {
  photo: string | undefined
  caption: string
  arrows: boolean
  onStep: (by: number) => void
  onOpen: () => void
}

export function GalleryFrame({ photo, caption, arrows, onStep, onOpen }: GalleryFrameProps) {
  const { handlers, swiped } = usePointerSwipe(onStep)
  return (
    <div className={styles.frame}>
      <button
        type="button"
        className={styles.main}
        onClick={() => {
          if (!swiped.current) onOpen()
        }}
        {...handlers}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') onStep(1)
          if (event.key === 'ArrowLeft') onStep(-1)
        }}
      >
        <Cover url={photo} caption={caption} />
      </button>
      {arrows ? <GalleryArrows onStep={onStep} /> : null}
    </div>
  )
}
