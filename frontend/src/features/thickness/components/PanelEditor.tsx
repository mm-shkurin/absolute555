// Форма замера одной панели: снимок экрана прибора и число с него.
//
// Фотография обязательна и здесь, и в контракте: замер без неё — те же слова
// «не бит не крашен», только цифрами.
import { useEffect, useRef, useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { checkMeasurement } from '../logic/measurementForm'
import type { PanelDetail } from '../../../shared/thicknessMap/thicknessMap'
import styles from '../thickness.module.css'

interface Props {
  detail: PanelDetail
  busy: boolean
  error: string | null
  onSave: (valueUm: number | null, photo: File) => void
  onRemove: () => void
  /** Прочитать снимок — число встаёт в поле для сверки, а не сохраняется молча. */
  onRead?: (photo: File) => Promise<number | null>
}

export function PanelEditor({ detail, busy, error, onSave, onRemove, onRead }: Props) {
  const [{ value, photo }, setForm] = useState<{ value: string; photo: File | null }>({
    value: '',
    photo: null,
  })
  const setValue = (next: string) => setForm((form) => ({ ...form, value: next }))
  const [refused, setRefused] = useState<string | null>(null)
  const [reading, setReading] = useState<'idle' | 'busy' | 'read' | 'unread'>('idle')
  const file = useRef<HTMLInputElement>(null)
  // Что в поле прямо сейчас — для ответа распознавания, который приходит позже. Стейт
  // в замыкании промиса застыл на моменте отправки снимка.
  const typed = useRef('')
  typed.current = value
  // Замер уже отправлен — подсказке, пришедшей после, в поле делать нечего.
  const sent = useRef(false)

  // Смена панели очищает форму: иначе число от капота уедет на крышу — и уедет молча,
  // потому что поле выглядит заполненным законно.
  useEffect(() => {
    setForm({ value: detail.valueUm === null ? '' : String(detail.valueUm), photo: null })
    setRefused(null)
    setReading('idle')
    if (file.current) file.current.value = ''
  }, [detail.code, detail.valueUm])

  const submit = () => {
    const checked = checkMeasurement(value, photo)
    if (!checked.ok) {
      setRefused(checked.reason)
      return
    }
    setRefused(null)
    sent.current = true
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
        onChange={(event) => {
          const chosen = event.target.files?.[0] ?? null
          setForm((form) => ({ ...form, photo: chosen }))
          if (!chosen || !onRead) return
          setReading('busy')
          const beforeRead = typed.current
          sent.current = false
          void onRead(chosen).then((read) => {
            if (read === null) return setReading('unread')
            // Пока читался снимок, продавец мог вписать число сам. Подсказка его не
            // затирает: она приходит через секунды, человек этого не ждёт, и увидел бы
            // он подмену уже в сохранённом замере.
            if (sent.current || typed.current !== beforeRead) return setReading('read')
            setValue(String(read))
            setReading('read')
          })
        }}
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
      {reading !== 'idle' ? (
        <p className={styles.note} data-testid="panel-reading">
          {reading === 'busy'
            ? 'Читаем число со снимка…'
            : reading === 'read'
              ? 'Число прочитано со снимка — сверьте его с экраном прибора перед сохранением.'
              : 'Не разобрали число на снимке — впишите его сами.'}
        </p>
      ) : null}
      {refused || error ? (
        <p className={styles.refused} role="alert" data-testid="panel-refused">
          {refused ?? error}
        </p>
      ) : null}
      <div className={styles.editorActions}>
        {/* Чтение снимка кнопку не запирает: оно идёт секундами, и запертая кнопка
            означает нажатие, на которое ничего не происходит, — продавец решает, что
            сломалось приложение. Своё число он уже вписал, подсказка ему не нужна;
            пришедшая позже, она в поле не встаёт. */}
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
