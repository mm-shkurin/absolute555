// Галерея объявления на сервере. Каждая правка возвращает галерею целиком, поэтому
// локальный список — это просто последний ответ сервера, а не своя копия, которую надо
// сводить с ним после каждой операции.
import { useCallback, useState } from 'react'
import type { GalleryWire, PhotoWire } from '../../shared/api/backend/saleCarContract'
import { addPhotos, loadDraft, removePhoto, setPhotoOrder } from './api/draftApi'

export interface Gallery {
  photos: PhotoWire[]
  /** Потолок приходит с сервера: он же его и стережёт. */
  limit: number
  busy: boolean
  error: string | null
  add: (files: File[]) => Promise<void>
  remove: (photoId: string) => Promise<void>
  reorder: (photoIds: string[]) => Promise<void>
  /** Перечитать галерею с сервера — при открытии начатого раньше черновика. */
  refresh: () => Promise<void>
}

const DEFAULT_LIMIT = 15

export function useGallery(saleCarId: string | null): Gallery {
  const [photos, setPhotos] = useState<PhotoWire[]>([])
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(
    async (action: (id: string) => Promise<GalleryWire>) => {
      if (!saleCarId) return
      setBusy(true)
      setError(null)
      try {
        const gallery = await action(saleCarId)
        setPhotos(gallery.photos)
        setLimit(gallery.limit)
      } catch (failure) {
        // Отказ показывается текстом: лимит фотографий и слишком большой файл — это то,
        // что человек может исправить сам, и молчание оставило бы его гадать.
        setError(failure instanceof Error ? failure.message : 'Не удалось изменить галерею.')
      } finally {
        setBusy(false)
      }
    },
    [saleCarId],
  )

  return {
    photos,
    limit,
    busy,
    error,
    add: (files) => run((id) => addPhotos(id, files)),
    refresh: () =>
      run(async (id) => {
        const car = await loadDraft(id)
        return { sale_car_id: id, photos: car.photos, limit: DEFAULT_LIMIT }
      }),
    remove: (photoId) => run((id) => removePhoto(id, photoId)),
    reorder: (photoIds) => run((id) => setPhotoOrder(id, photoIds)),
  }
}
