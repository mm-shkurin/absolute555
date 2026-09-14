// Галерея объявления на сервере. Каждая правка возвращает галерею целиком, поэтому
// локальный список — это просто последний ответ сервера, а не своя копия, которую надо
// сводить с ним после каждой операции.
import type { PhotoWire } from '../../shared/api/backend/saleCarContract'
import { addPhotos, loadDraft, removePhoto, setPhotoOrder } from './api/draftApi'
import { DEFAULT_LIMIT, useGalleryRequest } from './useGalleryRequest'

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

export function useGallery(saleCarId: string | null): Gallery {
  const { run, ...shown } = useGalleryRequest(saleCarId)
  return {
    ...shown,
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
