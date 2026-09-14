import styles from './Gallery.module.css'

interface GalleryArrowsProps {
  onStep: (by: number) => void
}

export function GalleryArrows({ onStep }: GalleryArrowsProps) {
  return (
    <>
      <button
        type="button"
        className={`${styles.arrow} ${styles.prev}`}
        onClick={() => onStep(-1)}
        aria-label="Предыдущий кадр"
        data-testid="gallery-prev"
      >
        ‹
      </button>
      <button
        type="button"
        className={`${styles.arrow} ${styles.next}`}
        onClick={() => onStep(1)}
        aria-label="Следующий кадр"
        data-testid="gallery-next"
      >
        ›
      </button>
    </>
  )
}
