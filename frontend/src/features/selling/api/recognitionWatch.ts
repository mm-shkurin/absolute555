// Сервер отвечает на загрузку сразу — принято, а не прочитано, — и результат приезжает
// потоком. Поток можно не застать, поэтому исход дополнительно перечитывается из
// объявления: `autofill` повторяет то, что приходило по SSE.
import { openListingStream } from '../../../shared/api/backend/listingStream'
import type { AutofillState } from '../../../shared/api/backend/saleCarContract'
import { fetchListing } from '../../../shared/api/backend/saleCarApi'
import { isFinal, outcomeOf } from '../logic/recognition'

// Перечитывание — страховка, а не основной канал: первая проверка через 4 с, каждая
// следующая в полтора раза реже, но не реже раза в 30 с. Распознавание, не закончившееся
// за минуту, частыми вопросами не ускорить, а сервер нагружает каждый открытый мастер.
export const FIRST_CHECK_MS = 4000
export const CHECK_BACKOFF = 1.5
export const MAX_CHECK_MS = 30000

interface Flag {
  current: boolean
}

type Settle = (state: AutofillState) => void

/** Возвращает остановку опроса. Следующая проверка ставится после ответа на предыдущую, а
 *  не по часам: медленный ответ не накапливает очередь одинаковых запросов. */
function pollOutcome(saleCarId: string, signal: AbortSignal, settled: Flag, settle: Settle) {
  let timer: ReturnType<typeof setTimeout> | undefined
  const checkAfter = (delay: number) => {
    timer = setTimeout(() => {
      void fetchListing(saleCarId, signal)
        .then((car) => {
          const state = car.autofill?.state
          if (state && isFinal(state)) settle(state)
        })
        // Неудачное перечитывание не исход: следующая проверка всё равно поставится ниже.
        .catch(() => undefined)
        .finally(() => {
          if (settled.current || signal.aborted) return
          checkAfter(Math.min(delay * CHECK_BACKOFF, MAX_CHECK_MS))
        })
    }, delay)
  }
  checkAfter(FIRST_CHECK_MS)
  return () => clearTimeout(timer)
}

/** Ждёт исход распознавания из потока и из перечитываний; возвращает отписку. */
export function watchRecognition(saleCarId: string, settled: Flag, onOutcome: Settle) {
  const aborter = new AbortController()
  let stopPolling: (() => void) | undefined
  const settle = (state: AutofillState) => {
    if (settled.current) return
    settled.current = true
    stopPolling?.()
    onOutcome(state)
  }
  const close = openListingStream(saleCarId, {
    onEvent: (event) => {
      const state = outcomeOf(event.status)
      if (state && isFinal(state)) settle(state)
    },
    // Оборванный поток не исход: объявление всё равно перечитывается, и там лежит то же самое.
    onError: () => undefined,
  })
  stopPolling = pollOutcome(saleCarId, aborter.signal, settled, settle)
  return () => {
    close()
    aborter.abort()
    stopPolling?.()
  }
}
