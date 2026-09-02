// Предложения по цене. Отправляет покупатель, отвечает владелец объявления.
import { send } from '../send'
import { BACKEND } from './paths'
import type { OfferCreate, OfferDecision, OfferWire } from './offerContract'

export function createOffer(offer: OfferCreate) {
  return send<OfferWire>(BACKEND.offer.collection, { method: 'POST', body: offer })
}

/** Мои предложения обеих сторон: `sent` — отправленные мной, `received` — присланные по
 *  моим объявлениям. Одной выдачей их не отдать: оффер несёт покупателя и не несёт
 *  продавца, и клиент не отличил бы стороны сам. */
export function fetchMyOffers(side: 'sent' | 'received', signal?: AbortSignal) {
  return send<OfferWire[]>(`${BACKEND.offer.mine}?side=${side}`, { signal })
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
export function answerOffer(offerId: string, status: OfferDecision) {
  return send<OfferWire>(BACKEND.offer.status(offerId), { method: 'PATCH', body: { status } })
}

/** Отозвать своё предложение. Отзывает только автор и только пока на него не ответили. */
export function withdrawOffer(offerId: string) {
  return send<OfferWire>(BACKEND.offer.withdraw(offerId), { method: 'POST' })
}
