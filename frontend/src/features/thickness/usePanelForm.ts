import { useEffect, useRef, useState } from 'react'
import type { PanelDetail } from '../../shared/thicknessMap/thicknessMap'
import { checkMeasurement } from './logic/measurementForm'
import { usePanelReading } from './usePanelReading'

export function usePanelForm(
  detail: PanelDetail,
  onSave: (valueUm: number | null, photo: File) => void,
  onRead?: (photo: File) => Promise<number | null>,
) {
  const [{ value, photo }, setForm] = useState<{ value: string; photo: File | null }>({
    value: '',
    photo: null,
  })
  const setValue = (next: string) => setForm((form) => ({ ...form, value: next }))
  const [refused, setRefused] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)
  const reading = usePanelReading(detail, value, setValue, onRead)

  // Смена панели очищает форму: иначе число от капота уедет на крышу — и уедет молча,
  // потому что поле выглядит заполненным законно.
  useEffect(() => {
    setForm({ value: detail.valueUm === null ? '' : String(detail.valueUm), photo: null })
    setRefused(null)
    if (file.current) file.current.value = ''
  }, [detail.code, detail.valueUm])

  const choosePhoto = (chosen: File | null) => {
    setForm((form) => ({ ...form, photo: chosen }))
    if (chosen) reading.read(chosen)
  }
  const submit = () => {
    const checked = checkMeasurement(value, photo)
    setRefused(checked.ok ? null : checked.reason)
    if (!checked.ok) return
    reading.markSent()
    onSave(checked.valueUm, checked.photo)
  }
  return { value, setValue, refused, reading: reading.state, file, choosePhoto, submit }
}
