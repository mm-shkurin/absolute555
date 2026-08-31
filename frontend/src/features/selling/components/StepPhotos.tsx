// Четвёртый шаг: фотографии. Потолок стережёт сервер, первая становится обложкой.
import { useRef } from 'react'
import { Button } from '../../../shared/ui/Button'
import type { PhotoWire } from '../../../shared/api/backend/saleCarContract'
import { Alert } from './Alert'
import { WizardCard, NavSpacer } from './WizardCard'
import styles from './StepPhotos.module.css'
import selling from '../selling.module.css'

export function StepPhotos({
  photos,
  limit,
  busy,
  error,
  onAdd,
  onRemove,
  onBack,
  onNext,
}: {
  photos: PhotoWire[]
  limit: number
  busy: boolean
  error: string | null
  onAdd: (files: File[]) => void
  onRemove: (photoId: string) => void
  onBack: () => void
  onNext: () => void
}) {
  const picker = useRef<HTMLInputElement>(null)
  const count = photos.length
  const take = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])]
    event.target.value = ''
    if (files.length > 0) onAdd(files)
  }
  return (
    <WizardCard
      testId="step-photos"
      title="Фотографии автомобиля"
      sub={`До ${limit} снимков. Первый становится обложкой.`}
      nav={
        <>
          <Button tone="ghost" onClick={onBack}>
            Назад
          </Button>
          <NavSpacer />
          <Button onClick={onNext} data-testid="photos-next">
            Дальше
          </Button>
        </>
      }
    >
      {error ? (
        <Alert tone="bad" title="Снимок не добавлен">
          {error}
        </Alert>
      ) : null}
      <input
        ref={picker}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        className={styles.picker}
        onChange={take}
        data-testid="photos-file"
      />
      <div className={styles.grid}>
        {photos.map((photo, index) => (
          <div
            key={photo.photo_id}
            className={[styles.slot, index === 0 ? styles.cover : ''].join(' ')}
          >
            <img src={photo.preview_url} alt="" />
            <button
              type="button"
              className={styles.drop}
              onClick={() => onRemove(photo.photo_id)}
              aria-label={`Удалить фото ${index + 1}`}
            >
              ×
            </button>
          </div>
        ))}
        {count < limit ? (
          <button
            type="button"
            className={styles.add}
            onClick={() => picker.current?.click()}
            disabled={busy}
            aria-label="Добавить фото"
          >
            +
          </button>
        ) : null}
      </div>
      <p className={selling.hint}>
        Снято {count} из {limit}. Покупатели чаще открывают объявления, где есть салон, багажник и
        моторный отсек, а не только три ракурса снаружи.
      </p>
    </WizardCard>
  )
}
