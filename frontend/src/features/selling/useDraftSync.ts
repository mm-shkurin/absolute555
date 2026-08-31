// Черновик на сервере: завести один раз и досылать правки.
//
// Отдельно от `useDraftState`, потому что состояние мастера обязано работать и без сети:
// человек фотографирует машину во дворе, и потеря связи не должна стирать введённое.
// Отсюда правило — сохранение может провалиться молча, а мастер продолжает работать.
import { useCallback, useEffect, useRef, useState } from 'react'
import { isEmptyPatch, loadDraft, saveDraft, sendSts, startDraft, toDraft } from './api/draftApi'
import { toPatch } from './logic/draftWire'
import type { Draft } from './logic/draft'

export interface DraftSync {
  saleCarId: string | null
  /** Последняя правка сохранена на сервере. Пока черновик не заведён — false. */
  saved: boolean
  save: (draft: Draft) => Promise<void>
  /** Приложить снимок СТС. Возвращает false, если черновика на сервере ещё нет или
   *  загрузка не удалась: мастер тогда остаётся на шаге с документом. */
  attachDocument: (file: File) => Promise<boolean>
  /** Перечитать объявление после распознавания. `null`, если читать нечего. */
  reload: () => Promise<Draft | null>
}

/** `existingId` — черновик, начатый раньше: мастер открыт по ссылке из «Моих объявлений»,
 *  и заводить второй черновик на ту же машину нельзя. */
export function useDraftSync(enabled: boolean, existingId?: string): DraftSync {
  const [saleCarId, setSaleCarId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  // Идентификатор нужен обработчикам сразу после создания, до следующего рендера.
  const idRef = useRef<string | null>(existingId ?? null)

  useEffect(() => {
    if (existingId) {
      idRef.current = existingId
      setSaleCarId(existingId)
      return
    }
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
  }, [enabled, existingId])

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

  const attachDocument = useCallback(async (file: File) => {
    const id = idRef.current
    if (!id) return false
    try {
      await sendSts(id, file)
      return true
    } catch {
      return false
    }
  }, [])

  const reload = useCallback(async () => {
    const id = idRef.current
    if (!id) return null
    try {
      return toDraft(await loadDraft(id))
    } catch {
      return null
    }
  }, [])

  return { saleCarId, saved, save, attachDocument, reload }
}
