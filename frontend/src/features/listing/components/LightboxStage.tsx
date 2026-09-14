import { Cover } from '../../../shared/ui/Cover'
import { usePointerSwipe } from './usePointerSwipe'
import styles from './Lightbox.module.css'

interface LightboxStageProps {
  photo: string | undefined
  caption: string
  onStep: (by: number) => void
}

export function LightboxStage({ photo, caption, onStep }: LightboxStageProps) {
  const { handlers } = usePointerSwipe(onStep)
  return (
    <div className={styles.stage} {...handlers}>
      <button
        type="button"
        className={styles.round}
        onClick={() => onStep(-1)}
        aria-label="Предыдущее фото"
      >
        ‹
      </button>
      <Cover url={photo} caption={caption} className={styles.stageShot} />
      <button
        type="button"
        className={styles.round}
        onClick={() => onStep(1)}
        aria-label="Следующее фото"
      >
        ›
      </button>
    </div>
  )
}
