import { useRef } from 'react'
import type { PhotoWire } from '../../../shared/api/backend/saleCarContract'
import { movedIds } from '../logic/photoOrder'
import { AddPhotoButton } from './AddPhotoButton'
import { FilePicker } from './FilePicker'
import { PhotoSlot } from './PhotoSlot'
import styles from './StepPhotos.module.css'

export interface PhotoGridProps {
  photos: PhotoWire[]
  limit: number
  busy: boolean
  onAdd: (files: File[]) => void
  onRemove: (photoId: string) => void
  /** Новый порядок целиком: первое фото — обложка, отдельного поля обложки нет. */
  onReorder: (photoIds: string[]) => void
}

export function PhotoGrid({ photos, limit, busy, onAdd, onRemove, onReorder }: PhotoGridProps) {
  const picker = useRef<HTMLInputElement>(null)
  const ids = photos.map((photo) => photo.photo_id)
  const move = (from: number, to: number) => {
    const next = busy ? null : movedIds(ids, from, to)
    if (next) onReorder(next)
  }
  const slot = { count: photos.length, busy, onMove: move, onRemove }
  return (
    <>
      <FilePicker
        inputRef={picker}
        className={styles.picker}
        testId="photos-file"
        multiple
        onFiles={onAdd}
      />
      <div className={styles.grid}>
        {photos.map((photo, index) => (
          <PhotoSlot key={photo.photo_id} photo={photo} index={index} {...slot} />
        ))}
        {photos.length < limit ? (
          <AddPhotoButton disabled={busy} onClick={() => picker.current?.click()} />
        ) : null}
      </div>
    </>
  )
}
