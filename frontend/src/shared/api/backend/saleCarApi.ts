// Объявления: чтение, правка, фотографии, скан СТС и переходы жизненного цикла.
//
// Клиент знает только форму провода. Ни одного правила о том, что показать человеку,
// здесь нет — это решает фича.
import { send } from '../send'
import { sendPublic } from '../sendPublic'
import { BACKEND } from './paths'
import type { FeedFilters, FeedPageWire, RevealedPhone } from './feedContract'
import type { RejectionLabel } from './moderationContract'
import type {
  ListingKind,
  DocumentLinkWire,
  GalleryWire,
  SaleCarPatch,
  SaleCarStatus,
  SaleCarWire,
  StatusChangedWire,
  StsAcceptedWire,
} from './saleCarContract'

const withStatus = (path: string, status?: SaleCarStatus) =>
  status ? `${path}?status=${encodeURIComponent(status)}` : path

function feedQuery(filters: FeedFilters): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue
    // Коробка повторяется параметром, а не склеивается запятой: так записано в спеке,
    // и склейка потребовала бы от сервера разбирать значение, в котором запятая законна.
    if (Array.isArray(value)) for (const item of value) params.append(key, item)
    else params.set(key, String(value))
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

/** Лента по контракту истории 7: страница, точный счётчик, фильтры и сортировка. */
export function fetchFeed(filters: FeedFilters = {}, signal?: AbortSignal) {
  return sendPublic<FeedPageWire>(`${BACKEND.saleCar.published}${feedQuery(filters)}`, { signal })
}

/** Телефон — отдельный запрос, а не поле выдачи: полем телефоны всей площадки
 *  выкачиваются одним проходом, и кнопка «Показать телефон» тогда ничего не значит. */
export function revealPhone(saleCarId: string) {
  return send<RevealedPhone>(BACKEND.saleCar.revealPhone(saleCarId), { method: 'POST' })
}

/** Прежняя выдача без страниц. Останется, пока история 7 не доедет на сервер. */
export function fetchPublished(status?: SaleCarStatus, signal?: AbortSignal) {
  return send<SaleCarWire[]>(withStatus(BACKEND.saleCar.published, status), { signal })
}

/** Свои объявления во всех статусах, включая черновики. */
export function fetchMyListings(status?: SaleCarStatus, signal?: AbortSignal) {
  return send<SaleCarWire[]>(withStatus(BACKEND.saleCar.mine, status), { signal })
}

/** Чужое неопубликованное объявление сервер отдаёт как ненайденное — это одно и то же
 *  и снаружи неразличимо намеренно. */
export function fetchListing(saleCarId: string, signal?: AbortSignal) {
  return sendPublic<SaleCarWire>(BACKEND.saleCar.one(saleCarId), { signal })
}

/** Черновик заводится пустым: полей в запросе нет, они дописываются правкой. Кроме
 *  вида — он выбирается здесь и потом не меняется. Привоз заводит только поставщик,
 *  чужая роль получает `403 NOT_AN_IMPORTER`. */
export function createDraft(kind: ListingKind = 'stock') {
  return send<SaleCarWire>(BACKEND.saleCar.draft, {
    method: 'POST',
    body: { listing_kind: kind },
  })
}

export function patchListing(saleCarId: string, patch: SaleCarPatch) {
  return send<SaleCarWire>(BACKEND.saleCar.one(saleCarId), { method: 'PATCH', body: patch })
}

export function deleteListing(saleCarId: string) {
  return send<void>(BACKEND.saleCar.one(saleCarId), { method: 'DELETE' })
}

export function uploadPhotos(saleCarId: string, files: File[]) {
  const form = new FormData()
  for (const file of files) form.append('files', file)
  return send<GalleryWire>(BACKEND.saleCar.photos(saleCarId), { method: 'POST', body: form })
}

export function deletePhoto(saleCarId: string, photoId: string) {
  return send<GalleryWire>(BACKEND.saleCar.photo(saleCarId, photoId), { method: 'DELETE' })
}

export function reorderPhotos(saleCarId: string, photoIds: string[]) {
  return send<GalleryWire>(BACKEND.saleCar.photoOrder(saleCarId), {
    method: 'PUT',
    body: { photo_ids: photoIds },
  })
}

/** Скан принят, но не прочитан: чтение идёт в очереди, результат приходит потоком. */
export function attachSts(saleCarId: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  return send<StsAcceptedWire>(BACKEND.saleCar.sts(saleCarId), { method: 'POST', body: form })
}

/** Распознавание по вписанному VIN. Форма ответа та же, что у снимка: принято сразу,
 *  исход приезжает потоком — экран не различает, чем распознавание было запущено. */
export function decodeVin(saleCarId: string, vin: string) {
  return send<StsAcceptedWire>(BACKEND.saleCar.decodeVin(saleCarId), {
    method: 'POST',
    body: JSON.stringify({ vin }),
  })
}

export function fetchStsLink(saleCarId: string, signal?: AbortSignal) {
  return send<DocumentLinkWire>(BACKEND.saleCar.sts(saleCarId), { signal })
}

type OwnerAction = 'submit' | 'withdraw' | 'sold' | 'republish' | 'revise'

/** Переходы, доступные владельцу. Какие из них разрешены в текущем статусе, решает
 *  сервер: таблица переходов живёт там, и дублировать её здесь значит разойтись с ней. */
export function changeStatus(saleCarId: string, action: OwnerAction) {
  return send<StatusChangedWire>(BACKEND.saleCar[action](saleCarId), { method: 'POST' })
}

export function approveListing(saleCarId: string) {
  return send<StatusChangedWire>(BACKEND.saleCar.approve(saleCarId), { method: 'POST' })
}

/** Метка обязательна, комментарий — нет. Метка нужна не продавцу, а нам: только по ней
 *  видно, что отклоняют чаще всего, и что стоит не пускать в мастере. */
export function rejectListing(saleCarId: string, label: RejectionLabel, comment?: string) {
  return send<StatusChangedWire>(BACKEND.saleCar.reject(saleCarId), {
    method: 'POST',
    body: comment?.trim() ? { label, comment: comment.trim() } : { label },
  })
}
