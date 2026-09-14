import type { PhotoWire } from '../../../shared/api/backend/saleCarContract'
import { PhotoSlotTools } from './PhotoSlotTools'
import styles from './StepPhotos.module.css'

export interface PhotoSlotProps {
  photo: PhotoWire
  index: number
  count: number
  busy: boolean
  onMove: (from: number, to: number) => void
  onRemove: (photoId: string) => void
}

export function PhotoSlot({ photo, index, count, busy, onMove, onRemove }: PhotoSlotProps) {
  return (
    <div className={[styles.slot, index === 0 ? styles.cover : ''].join(' ')}>
      <img src={photo.preview_url} alt="" />
      <PhotoSlotTools index={index} count={count} busy={busy} onMove={onMove} />
      <button
        type="button"
        className={styles.drop}
        onClick={() => onRemove(photo.photo_id)}
        aria-label={`Удалить фото ${index + 1}`}
      >
        ×
      </button>
    </div>
  )
}
