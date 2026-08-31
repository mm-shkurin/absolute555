// Черновик на сервере: завести один раз и досылать правки.
//
// Отдельно от `useDraftState`, потому что состояние мастера обязано работать и без сети:
// человек фотографирует машину во дворе, и потеря связи не должна стирать введённое.
// Отсюда правило — сохранение может провалиться молча, а мастер продолжает работать.
import { useCallback, useEffect, useRef, useState } from 'react'
import { isEmptyPatch, saveDraft, startDraft } from './api/draftApi'
import { toPatch } from './logic/draftWire'
import type { Draft } from './logic/draft'

export interface DraftSync {
  saleCarId: string | null
  /** Последняя правка сохранена на сервере. Пока черновик не заведён — false. */
  saved: boolean
  save: (draft: Draft) => Promise<void>
}

export function useDraftSync(enabled: boolean): DraftSync {
  const [saleCarId, setSaleCarId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  // Идентификатор нужен обработчикам сразу после создания, до следующего рендера.
  const idRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || idRef.current) return
    let cancelled = false
    startDraft()
      .then((car) => {
        if (cancelled) return
        idRef.current = car.sale_car_id
        setSaleCarId(car.sale_car_id)
      })
      // Гость и оборванная сеть выглядят здесь одинаково: черновик остаётся только на
      // экране, и мастер об этом молчит до попытки отправки.
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [enabled])

  const save = useCallback(async (draft: Draft) => {
    const id = idRef.current
    if (!id) return
    const patch = toPatch(draft)
    // Пустую правку сервер отвергает как ошибку — на первом шаге отправлять ещё нечего.
    if (isEmptyPatch(patch)) return
    try {
      await saveDraft(id, draft)
      setSaved(true)
    } catch {
      setSaved(false)
    }
  }, [])

  return { saleCarId, saved, save }
}
