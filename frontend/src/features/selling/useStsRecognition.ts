// Ожидание исхода распознавания СТС.
import { useCallback, useEffect, useRef, useState } from 'react'
import type { AutofillState } from '../../shared/api/backend/saleCarContract'
import { watchRecognition } from './api/recognitionWatch'

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
    return watchRecognition(saleCarId, settled, setOutcome)
  }, [saleCarId, watching])

  return { outcome, reset }
}
