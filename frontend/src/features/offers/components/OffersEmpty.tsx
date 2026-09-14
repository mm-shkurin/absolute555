import { EmptyNotice } from '../../../shared/ui/ListStates'
import type { OfferDirection } from '../api/offersApi'

interface OffersEmptyProps {
  direction: OfferDirection
}

export function OffersEmpty({ direction }: OffersEmptyProps) {
  return (
    <EmptyNotice
      title={direction === 'incoming' ? 'Предложений пока нет' : 'Вы ещё не торговались'}
    >
      {direction === 'incoming'
        ? 'Как только покупатель предложит цену, оффер появится здесь.'
        : 'Откройте объявление в ленте и предложите свою цену — торг идёт на площадке.'}
    </EmptyNotice>
  )
}
