// Офферы обеих сторон одним запросом с параметром направления: экран переключает вкладку
// мгновенно, а два разных пути к одному списку разошлись бы в форме ответа.
import { answerOffer, fetchMyOffers, withdrawOffer } from '../../../shared/api/backend/offerApi'
import type {
  OfferStatus,
  OfferWire as BackendOffer,
} from '../../../shared/api/backend/offerContract'
import { fetchMyListings } from '../../../shared/api/backend/saleCarApi'
import type { SaleCarWire } from '../../../shared/api/backend/saleCarContract'

export type OfferDirection = 'incoming' | 'outgoing'

// Имена состояний берутся с провода: свой синоним `sold` вместо `car_sold` означал бы
// перевод в обе стороны на каждой границе.
export type { OfferStatus }

export interface OfferListItemWire {
  id: string
  listing_id: string
  listing_title: string
  listing_year: number
  listing_price: number
  photo_url: string | null
  amount: number
  status: OfferStatus
  can_review: boolean
  review_id: string | null
  created_at: string
  expires_at: string | null
  counterparty_name: string
  counterparty_rating: number | null
}

export interface OffersWire {
  items: OfferListItemWire[]
  incoming_total: number
  outgoing_total: number
}

function toItem(offer: BackendOffer, car: SaleCarWire | undefined): OfferListItemWire {
  return {
    id: offer.offer_id,
    listing_id: offer.sale_car_id,
    listing_title: car
      ? `${car.brand ?? car.mark_raw ?? ''} ${car.model ?? car.model_raw ?? ''}`.trim()
      : '',
    listing_year: car?.year ?? 0,
    listing_price: car?.price ?? 0,
    photo_url: car?.preview_photo_url ?? null,
    amount: offer.price,
    // Состояния совпадают один в один: экран и сервер называют их одинаково с истории 10.
    status: offer.status,
    // Право на отзыв приезжает ответом, а не выводится из статуса: принятый оффер чужой
    // стороны отзыва не даёт, и угаданное право показало бы кнопку, которой нет.
    can_review: offer.can_review,
    review_id: offer.review_id,
    created_at: offer.created_at,
    expires_at: offer.expires_at,
    // Ни имени, ни рейтинга второй стороны: профиль чужого пользователя закрыт.
    counterparty_name: '',
    counterparty_rating: null,
  }
}

const SIDE = { incoming: 'received', outgoing: 'sent' } as const

/** Заголовок и фотография берутся из своих объявлений: у входящих машина всегда своя, а
 *  у отправленных карточку чужого объявления пришлось бы запрашивать по одной на
 *  предложение. Чего в этом списке нет — то и не рисуется. */
async function side(direction: OfferDirection, signal?: AbortSignal) {
  const [offers, cars] = await Promise.all([
    fetchMyOffers(SIDE[direction], signal),
    fetchMyListings(undefined, signal),
  ])
  const byId = new Map(cars.map((car) => [car.sale_car_id, car]))
  return offers.map((offer) => toItem(offer, byId.get(offer.sale_car_id)))
}

export async function fetchOffers(
  direction: OfferDirection,
  signal?: AbortSignal,
): Promise<OffersWire> {
  const items = await side(direction, signal)
  return {
    items,
    incoming_total: direction === 'incoming' ? items.length : 0,
    outgoing_total: direction === 'outgoing' ? items.length : 0,
  }
}

export function acceptOffer(offerId: string) {
  return answerOffer(offerId, 'accepted')
}

export function rejectOffer(offerId: string) {
  return answerOffer(offerId, 'rejected')
}

export { withdrawOffer }
