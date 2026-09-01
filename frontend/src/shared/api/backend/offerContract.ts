// Предложения по цене — контракт истории 10, `ProductSpecification/api-specs/offers.yaml`.
//
// Шесть состояний, а не три: «вы отозвали», «никто не ответил» и «машину купил другой» —
// три разных предложения покупателю, и сводить их в одно «не состоялось» значит не
// сказать ни одного из них.
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired' | 'car_sold'

/** Что может ответить продавец. Остальные три состояния — ничьё решение: их ставит
 *  срок, продажа машины или сам покупатель. */
export type OfferDecision = 'accepted' | 'rejected'

export interface OfferWire {
  offer_id: string
  sale_car_id: string
  user_id: string
  price: number
  status: OfferStatus
  /** Когда предложение сгорит само. `null` — у тех, что уже закрыты. */
  expires_at: string | null
  created_at: string
  updated_at: string | null

  /** Право на отзыв и уже написанный отзыв — два поля, а не одно: по первому экран
   *  включает кнопку, по второму заменяет её на «изменить». На полученных офферах оба
   *  пусты всегда — оценка односторонняя, продавец покупателя не оценивает. */
  can_review: boolean
  review_id: string | null
}

export interface OfferCreate {
  sale_car_id: string
  /** Строго больше нуля — сервер отвергает ноль и отрицательное. */
  price: number
}
