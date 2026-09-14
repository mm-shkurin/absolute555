import type { StatusTone } from '../../../shared/ui/StatusBadge'
import type { OfferStatus } from '../api/offersApi'

export const OFFER_TONE: Record<OfferStatus, StatusTone> = {
  pending: 'wait',
  accepted: 'ok',
  rejected: 'bad',
  withdrawn: 'past',
  expired: 'past',
  car_sold: 'bad',
}

export const OFFER_LABEL: Record<OfferStatus, string> = {
  pending: 'ждёт ответа',
  accepted: 'принято',
  rejected: 'отклонено',
  withdrawn: 'отозван вами',
  expired: 'истёк',
  car_sold: 'машину продали',
}
