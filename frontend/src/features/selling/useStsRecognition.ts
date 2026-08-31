// Ожидание исхода распознавания СТС.
//
// Сервер отвечает на загрузку сразу — принято, а не прочитано, — и результат приезжает
// потоком. Поток можно не застать, поэтому исход дополнительно перечитывается из
// объявления: `autofill` повторяет то, что приходило по SSE.
import { useCallback, useEffect, useRef, useState } from 'react'
import { openListingStream } from '../../shared/api/backend/listingStream'
import type { AutofillState } from '../../shared/api/backend/saleCarContract'
import { loadDraft } from './api/draftApi'
import { isFinal, outcomeOf } from './logic/recognition'

export function useStsRecognition(saleCarId: string | null, watching: boolean) {
  const [outcome, setOutcome] = useState<AutofillState | null>(null)
  const settled = useRef(false)

  const reset = useCallback(() => {
    settled.current = false
    setOutcome(null)
  }, [])

  useEffect(() => {
    if (!saleCarId || !watching) return
    settled.current = false

    const settle = (state: AutofillState) => {
      if (settled.current) return
      settled.current = true
      setOutcome(state)
    }

    const close = openListingStream(saleCarId, {
      onEvent: (event) => {
        const state = outcomeOf(event.status)
        if (state && isFinal(state)) settle(state)
      },
      // Оборванный поток не исход: объявление ниже всё равно перечитывается, и там
      // лежит то же самое.
      onError: () => undefined,
    })

    // Страховка на случай, если поток не застали: исход уже мог быть записан в объявление.
    const timer = window.setInterval(() => {
      void loadDraft(saleCarId)
        .then((car) => {
          const state = car.autofill?.state
          if (state && isFinal(state)) settle(state)
        })
        .catch(() => undefined)
    }, 4000)

    return () => {
      close()
      window.clearInterval(timer)
    }
  }, [saleCarId, watching])

  return { outcome, reset }
}
