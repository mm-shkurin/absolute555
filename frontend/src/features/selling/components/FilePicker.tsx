import type { ChangeEvent, RefObject } from 'react'

export interface FilePickerProps {
  inputRef: RefObject<HTMLInputElement>
  className: string
  testId: string
  multiple?: boolean
  onFiles: (files: File[]) => void
}

export function FilePicker({ inputRef, className, testId, multiple, onFiles }: FilePickerProps) {
  const take = (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])]
    // Значение сбрасывается, чтобы повторный выбор того же файла снова дал событие.
    event.target.value = ''
    if (files.length > 0) onFiles(files)
  }
  return (
    <input
      ref={inputRef}
      type="file"
      accept="image/jpeg,image/png"
      multiple={multiple}
      className={className}
      onChange={take}
      data-testid={testId}
    />
  )
}
