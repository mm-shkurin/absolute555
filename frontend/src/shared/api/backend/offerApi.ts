// Предложения по цене. Отправляет покупатель, отвечает владелец объявления.
import { send } from '../send'
import { BACKEND } from './paths'
import type { OfferCreate, OfferStatus, OfferWire } from './offerContract'

export function createOffer(offer: OfferCreate) {
  return send<OfferWire>(BACKEND.offer.collection, { method: 'POST', body: offer })
}

/** Предложения, отправленные мной. */
export function fetchMyOffers(signal?: AbortSignal) {
  return send<OfferWire[]>(BACKEND.offer.mine, { signal })
}

/** Предложения по конкретной машине — их видит владелец объявления. */
export function fetchOffersForCar(saleCarId: string, signal?: AbortSignal) {
  return send<OfferWire[]>(BACKEND.offer.ofCar(saleCarId), { signal })
}

export function fetchOffer(offerId: string, signal?: AbortSignal) {
  return send<OfferWire>(BACKEND.offer.one(offerId), { signal })
}

/** Принять или отклонить. Что происходит с остальными предложениями машины после
 *  принятия — правило сервера, и клиент его не повторяет. */
export function answerOffer(offerId: string, status: OfferStatus) {
  return send<OfferWire>(BACKEND.offer.status(offerId), { method: 'PATCH', body: { status } })
}
