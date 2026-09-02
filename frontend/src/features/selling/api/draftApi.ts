// Клиент мастера продажи. Ходит по контрактам историй 4, 5 и 6: черновик заводится пустым,
// поля дописываются правкой, снимок СТС уходит отдельной ручкой и читается в фоне.
//
// `api-specs/sale_car_draft.yaml`, `sale_car_sts.yaml`, `sale_car_photos.yaml`,
// `sale_car_lifecycle.yaml`.
import {
  attachSts,
  changeStatus,
  createDraft,
  deletePhoto,
  fetchListing,
  patchListing,
  reorderPhotos,
  uploadPhotos,
} from '../../../shared/api/backend/saleCarApi'
import type {
  ListingKind,
  SaleCarPatch,
  SaleCarWire,
} from '../../../shared/api/backend/saleCarContract'
import type { Draft } from '../logic/draft'
import { toDraft, toPatch } from '../logic/draftWire'

export type { SaleCarWire }

/** Черновик создаётся пустым: первый шаг мастера — фотография документа, и полей на нём
 *  ещё нет. Сервер отвечает объявлением в статусе draft.
 *
 *  Вид объявления выбирается здесь и потом не меняется: смена канала на живом объявлении
 *  означала бы, что покупатель торговался за машину, которой в стране нет. */
export function startDraft(kind: ListingKind = 'stock'): Promise<SaleCarWire> {
  return createDraft(kind)
}

export function loadDraft(saleCarId: string, signal?: AbortSignal): Promise<SaleCarWire> {
  return fetchListing(saleCarId, signal)
}

/** Сохраняет то, что человек успел ввести. Пустая правка сервером отвергается, поэтому
 *  вызывающий проверяет, есть ли что сохранять. */
export function saveDraft(saleCarId: string, draft: Draft): Promise<SaleCarWire> {
  return patchListing(saleCarId, toPatch(draft))
}

export function isEmptyPatch(patch: SaleCarPatch): boolean {
  return Object.keys(patch).length === 0
}

/** Снимок принят сразу, до распознавания: читает фон, а не запрос. Исход приезжает по SSE
 *  и повторяется полем `autofill` в выдаче объявления. */
export function sendSts(saleCarId: string, file: File) {
  return attachSts(saleCarId, file)
}

export function addPhotos(saleCarId: string, files: File[]) {
  return uploadPhotos(saleCarId, files)
}

export function removePhoto(saleCarId: string, photoId: string) {
  return deletePhoto(saleCarId, photoId)
}

export function setPhotoOrder(saleCarId: string, photoIds: string[]) {
  return reorderPhotos(saleCarId, photoIds)
}

/** Отправка на модерацию. Что именно обязано быть заполнено, решает сервер: таблица
 *  переходов живёт там, и второй её экземпляр здесь разошёлся бы с первым. */
export function submitDraft(saleCarId: string) {
  return changeStatus(saleCarId, 'submit')
}

export { toDraft }
