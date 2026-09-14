import { useCallback, useState } from 'react'
import { isEmptyPatch, loadDraft, saveDraft, sendSts, sendVin, toDraft } from './api/draftApi'
import { toPatch } from './logic/draftWire'
import type { Draft } from './logic/draft'

interface IdRef {
  current: string | null
}

export function useDraftSave(idRef: IdRef) {
  const [saved, setSaved] = useState(false)

  const save = useCallback(
    async (draft: Draft) => {
      const id = idRef.current
      if (!id) return
      // Пустую правку сервер отвергает как ошибку — на первом шаге отправлять ещё нечего.
      if (isEmptyPatch(toPatch(draft))) return
      try {
        await saveDraft(id, draft)
        setSaved(true)
      } catch {
        setSaved(false)
      }
    },
    [idRef],
  )

  const reload = useCallback(async () => {
    const id = idRef.current
    if (!id) return null
    try {
      return toDraft(await loadDraft(id))
    } catch {
      return null
    }
  }, [idRef])

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
        return false
      }
    },
    [draftId],
  )

  const attachDocument = useCallback((file: File) => start((id) => sendSts(id, file)), [start])
  const decodeByVin = useCallback((vin: string) => start((id) => sendVin(id, vin)), [start])

  return { attachDocument, decodeByVin }
}
