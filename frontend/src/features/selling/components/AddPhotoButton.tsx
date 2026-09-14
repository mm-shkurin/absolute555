import styles from './StepPhotos.module.css'

export interface AddPhotoButtonProps {
  disabled: boolean
  onClick: () => void
}

export function AddPhotoButton({ disabled, onClick }: AddPhotoButtonProps) {
  return (
    <button
      type="button"
      className={styles.add}
      onClick={onClick}
      disabled={disabled}
      aria-label="Добавить фото"
    >
      +
    </button>
  )
}
