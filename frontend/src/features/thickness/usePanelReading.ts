import { useEffect, useRef, useState } from 'react'
import type { PanelDetail } from '../../shared/thicknessMap/thicknessMap'

export type ReadingState = 'idle' | 'busy' | 'read' | 'unread'

export function usePanelReading(
  detail: PanelDetail,
  value: string,
  apply: (next: string) => void,
  onRead?: (photo: File) => Promise<number | null>,
) {
  const [state, setState] = useState<ReadingState>('idle')
  // Что в поле прямо сейчас — для ответа распознавания, который приходит позже. Стейт
  // в замыкании промиса застыл на моменте отправки снимка.
  const typed = useRef('')
  typed.current = value
  // Замер уже отправлен — подсказке, пришедшей после, в поле делать нечего.
  const sent = useRef(false)

  useEffect(() => setState('idle'), [detail.code, detail.valueUm])

  const read = (chosen: File) => {
    if (!onRead) return
    setState('busy')
    const beforeRead = typed.current
    sent.current = false
    void onRead(chosen).then((result) => {
      if (result === null) return setState('unread')
      // Пока читался снимок, продавец мог вписать число сам. Подсказка его не
      // затирает: она приходит через секунды, человек этого не ждёт, и увидел бы
      // он подмену уже в сохранённом замере.
      if (sent.current || typed.current !== beforeRead) return setState('read')
      apply(String(result))
      setState('read')
    })
  }
  const markSent = () => {
    sent.current = true
  }
  return { state, read, markSent }
}
