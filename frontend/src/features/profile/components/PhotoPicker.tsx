import type { RefObject } from 'react'
import styles from '../identity.module.css'

interface PhotoPickerProps {
  inputRef: RefObject<HTMLInputElement>
  onPick: (file: File) => void
}

export function PhotoPicker({ inputRef, onPick }: PhotoPickerProps) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept="image/jpeg,image/png"
      className={styles.picker}
      data-testid="profile-photo-file"
      onChange={(event) => {
        const file = event.target.files?.[0]
        if (file) onPick(file)
        event.target.value = ''
      }}
    />
  )
}
