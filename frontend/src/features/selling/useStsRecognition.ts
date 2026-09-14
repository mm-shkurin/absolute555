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

// Перечитывание — страховка, а не основной канал: первая проверка через 4 с, каждая
// следующая в полтора раза реже, но не реже раза в 30 с. Распознавание, не закончившееся
// за минуту, частыми вопросами не ускорить, а сервер нагружает каждый открытый мастер.
export const FIRST_CHECK_MS = 4000
export const CHECK_BACKOFF = 1.5
export const MAX_CHECK_MS = 30000

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
    const aborter = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined

    const settle = (state: AutofillState) => {
      if (settled.current) return
      settled.current = true
      clearTimeout(timer)
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

    // Следующая проверка ставится после ответа на предыдущую, а не по часам: медленный
    // ответ не накапливает очередь одинаковых запросов.
    const checkAfter = (delay: number) => {
      timer = setTimeout(() => {
        void loadDraft(saleCarId, aborter.signal)
          .then((car) => {
            const state = car.autofill?.state
            if (state && isFinal(state)) settle(state)
          })
          .catch(() => undefined)
          .finally(() => {
            if (settled.current || aborter.signal.aborted) return
            checkAfter(Math.min(delay * CHECK_BACKOFF, MAX_CHECK_MS))
          })
      }, delay)
    }
    checkAfter(FIRST_CHECK_MS)

    return () => {
      close()
      aborter.abort()
      clearTimeout(timer)
    }
  }, [saleCarId, watching])

  return { outcome, reset }
}
