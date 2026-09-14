import { useCallback, useState } from 'react'
import { failureText } from '../../shared/api/failureText'
import type { GalleryWire, PhotoWire } from '../../shared/api/backend/saleCarContract'

export const DEFAULT_LIMIT = 15

export function useGalleryRequest(saleCarId: string | null) {
  // Фотографии и потолок приходят одним ответом и меняются только вместе.
  const [shown, setShown] = useState<{ photos: PhotoWire[]; limit: number }>({
    photos: [],
    limit: DEFAULT_LIMIT,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(
    async (action: (id: string) => Promise<GalleryWire>) => {
      if (!saleCarId) return
      setBusy(true)
      setError(null)
      try {
        const gallery = await action(saleCarId)
        setShown({ photos: gallery.photos, limit: gallery.limit })
      } catch (failure) {
        // Отказ показывается текстом: лимит фотографий и слишком большой файл — это то,
        // что человек может исправить сам, и молчание оставило бы его гадать.
        setError(failure instanceof Error ? failure.message : failureText(failure))
      } finally {
        setBusy(false)
      }
    },
    [saleCarId],
  )

  return { ...shown, busy, error, run }
}
