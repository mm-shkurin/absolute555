// Форма замера одной панели: снимок экрана прибора и число с него.
//
// Фотография обязательна и здесь, и в контракте: замер без неё — те же слова
// «не бит не крашен», только цифрами.
import { useEffect, useRef, useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { checkMeasurement } from '../logic/measurementForm'
import type { PanelDetail } from '../logic/thicknessMap'
import styles from '../thickness.module.css'

interface Props {
  detail: PanelDetail
  busy: boolean
  error: string | null
  onSave: (valueUm: number, photo: File) => void
  onRemove: () => void
}

export function PanelEditor({ detail, busy, error, onSave, onRemove }: Props) {
  const [value, setValue] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [refused, setRefused] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)

  // Смена панели очищает форму: иначе число от капота уедет на крышу — и уедет молча,
  // потому что поле выглядит заполненным законно.
  useEffect(() => {
    setValue(detail.valueUm === null ? '' : String(detail.valueUm))
    setPhoto(null)
    setRefused(null)
    if (file.current) file.current.value = ''
  }, [detail.code, detail.valueUm])

  const submit = () => {
    const checked = checkMeasurement(value, photo)
    if (!checked.ok) {
      setRefused(checked.reason)
      return
    }
    setRefused(null)
    onSave(checked.valueUm, checked.photo)
  }

  return (
    <div className={styles.block} data-testid="panel-editor">
      <h3 className={styles.panelTitle}>{detail.label}</h3>
      <p className={styles.note}>
        {detail.measured ? `Замерено: ${detail.value}` : 'Панель ещё не замерена.'}
      </p>
      <input
        ref={file}
        type="file"
        accept="image/*"
        className={styles.file}
        data-testid="panel-photo"
        onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
      />
      <input
        type="text"
        inputMode="numeric"
        className={styles.field}
        placeholder="число с экрана прибора"
        data-testid="panel-value"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      {refused || error ? (
        <p className={styles.refused} role="alert" data-testid="panel-refused">
          {refused ?? error}
        </p>
      ) : null}
      <div className={styles.editorActions}>
        <Button onClick={submit} disabled={busy} data-testid="panel-save">
          Сохранить замер
        </Button>
        {detail.measured ? (
          <Button tone="ghost" onClick={onRemove} disabled={busy} data-testid="panel-remove">
            Убрать замер
          </Button>
        ) : null}
      </div>
    </div>
  )
}
