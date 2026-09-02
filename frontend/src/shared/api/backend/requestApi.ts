// Спрос покупателя и отклики на него.
import { send } from '../send'
import { BACKEND } from './paths'
import type {
  BuyerRequestCreate,
  BuyerRequestPageWire,
  BuyerRequestWire,
  SupplierResponseCreate,
  SupplierResponseWire,
} from './requestContract'

/** Больше трёх открытых заявок на покупателя сервер не принимает: `409
 *  REQUEST_LIMIT_REACHED` с пределом в `details.limit`. */
export function openRequest(request: BuyerRequestCreate) {
  return send<BuyerRequestWire>(BACKEND.request.collection, { method: 'POST', body: request })
}

/** Лента спроса. Читает роль importer: покупателю она сказала бы, с кем он в очереди. */
export function fetchOpenRequests(page = 1, signal?: AbortSignal) {
  return send<BuyerRequestPageWire>(`${BACKEND.request.collection}?page=${page}`, { signal })
}

export function fetchMyRequests(signal?: AbortSignal) {
  return send<BuyerRequestWire[]>(BACKEND.request.mine, { signal })
}

export function closeRequest(requestId: string) {
  return send<BuyerRequestWire>(BACKEND.request.close(requestId), { method: 'POST' })
}

/** Идемпотентно: один отклик на поставщика, повторный вызов правит свой. Иначе покупатель
 *  видел бы одного поставщика дважды с двумя ценами. */
export function putResponse(requestId: string, response: SupplierResponseCreate) {
  return send<SupplierResponseWire>(BACKEND.request.response(requestId), {
    method: 'PUT',
    body: response,
  })
}

/** Автору заявки — все отклики, поставщику — свой, постороннему `404`. */
export function fetchResponses(requestId: string, signal?: AbortSignal) {
  return send<SupplierResponseWire[]>(BACKEND.request.responses(requestId), { signal })
}
