import type { RefObject } from 'react'
import { FilePicker } from './FilePicker'
import styles from './StepDocument.module.css'

export interface DocumentDropZoneProps {
  inputRef: RefObject<HTMLInputElement>
  onChoose: () => void
  onPick: (file: File) => void
}

// `capture` не ставим: на телефоне это заперло бы выбор на камере, а снимок документа
// часто уже лежит в галерее.
export function DocumentDropZone({ inputRef, onChoose, onPick }: DocumentDropZoneProps) {
  return (
    <>
      <FilePicker
        inputRef={inputRef}
        className={styles.picker}
        testId="document-file"
        onFiles={(files) => onPick(files[0])}
      />
      <button type="button" className={styles.drop} onClick={onChoose}>
        <span className={styles.dropIcon}>СТС</span>
        Сфотографировать или перетащить файл
        <span className={styles.dropHint}>
          JPG или PNG, до 10 МБ. Снимайте без бликов, чтобы номер VIN попал в кадр целиком.
        </span>
      </button>
    </>
  )
}
