// Профиль поставщика: свой, чужой публичный и очередь модератора.
import { send } from '../send'
import { sendPublic } from '../sendPublic'
import { BACKEND } from './paths'
import type {
  SupplierPageWire,
  SupplierProfileUpdate,
  SupplierProfileWire,
  SupplierQueueWire,
} from './supplierContract'

/** Свой профиль. Заводится сервером при первом чтении, в статусе draft. */
export function fetchMyProfile(signal?: AbortSignal) {
  return send<SupplierProfileWire>(BACKEND.supplier.me, { signal })
}

/** Правка после отказа возвращает профиль в черновик и снимает причину отказа. */
export function saveMyProfile(update: SupplierProfileUpdate) {
  return send<SupplierProfileWire>(BACKEND.supplier.me, { method: 'PUT', body: update })
}

export function submitMyProfile() {
  return send<SupplierProfileWire>(BACKEND.supplier.submit, { method: 'POST' })
}

/** Только опубликованный профиль. Неопубликованный и отсутствующий — один ответ: другой
 *  сказал бы читателю, кто подал заявку и ещё не прошёл проверку. */
/** Витрины одобренных поставщиков — лента вкладки «Поставщики». Открыта и гостю. */
export function fetchSuppliers(page = 1, signal?: AbortSignal) {
  return send<SupplierPageWire>(`${BACKEND.supplier.collection}?page=${page}`, { signal })
}

export function fetchSupplierProfile(userId: string, signal?: AbortSignal) {
  return sendPublic<SupplierProfileWire>(BACKEND.supplier.one(userId), { signal })
}

export function fetchSupplierQueue(signal?: AbortSignal) {
  return send<SupplierQueueWire>(BACKEND.moderation.suppliers, { signal })
}

export function approveSupplier(userId: string) {
  return send<SupplierProfileWire>(BACKEND.moderation.approveSupplier(userId), { method: 'POST' })
}

/** Отказ без причины сервер отвергает: заявитель должен понять, что исправить. */
export function rejectSupplier(userId: string, reason: string) {
  return send<SupplierProfileWire>(BACKEND.moderation.rejectSupplier(userId), {
    method: 'POST',
    body: { reason },
  })
}
