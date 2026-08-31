// Предложения по цене — зеркало `backend/app/schemas/offer.py`.
//
// Значения статуса на сервере именно такие: `accept` и `reject`, а не `accepted`
// и `rejected`.
export type OfferStatus = 'pending' | 'accept' | 'reject'

export interface OfferWire {
  offer_id: string
  sale_car_id: string
  user_id: string
  price: number
  status: OfferStatus
  created_at: string
  updated_at: string | null
}

export interface OfferCreate {
  sale_car_id: string
  /** Строго больше нуля — сервер отвергает ноль и отрицательное. */
  price: number
}
