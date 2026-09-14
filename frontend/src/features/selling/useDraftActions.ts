import { useCallback, useEffect, useRef, useState } from 'react'
import { attachSts, decodeVin, fetchListing } from '../../shared/api/backend/saleCarApi'
import { saveDraft } from './api/draftApi'
import { isEmptyPatch, toDraft, toPatch } from './logic/draftWire'
import type { Draft } from './logic/draft'

interface IdRef {
  current: string | null
}

async function reloadDraft(id: string | null) {
  if (!id) return null
  try {
    return toDraft(await fetchListing(id))
  } catch {
    // Недоступный черновик мастер открывает пустым: причина отказа продавцу ничего не даёт.
    return null
  }
}

export function useDraftSave(idRef: IdRef) {
  const [saved, setSaved] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const save = useCallback(
    async (draft: Draft) => {
      const id = idRef.current
      if (!id) return
      // Пустую правку сервер отвергает как ошибку — на первом шаге отправлять ещё нечего.
      if (isEmptyPatch(toPatch(draft))) return
      const ok = await saveDraft(id, draft).then(
        () => true,
        () => false,
      )
      if (mounted.current) setSaved(ok)
    },
    [idRef],
  )

  const reload = useCallback(() => reloadDraft(idRef.current), [idRef])

  return { saved, save, reload }
}

// Снимок и вписанный VIN — два входа в одно распознавание, и запускаются одинаково:
// дождаться черновика, послать, ответить мастеру, дошло ли.
export function useRecognitionStart(draftId: () => Promise<string | null>) {
  const start = useCallback(
    async (send: (id: string) => Promise<unknown>) => {
      const id = await draftId()
      if (!id) return false
      try {
        await send(id)
        return true
      } catch {
        // По «не дошло» мастер возвращается на прежний экран, текст отказа там не показывается.
        return false
      }
    },
    [draftId],
  )

  const attachDocument = useCallback((file: File) => start((id) => attachSts(id, file)), [start])
  const decodeByVin = useCallback((vin: string) => start((id) => decodeVin(id, vin)), [start])

  return { attachDocument, decodeByVin }
}
