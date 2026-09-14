// Отклики поставщиков. Самый дешёвый помечен, но не поднят наверх: порядок откликов —
// хронология, а перестановка по цене выдавала бы дешёвое за лучшее.
import type { BidView } from '../logic/requestView'
import { BidCard } from './BidCard'

interface BidListProps {
  bids: BidView[]
}

export function BidList({ bids }: BidListProps) {
  if (bids.length === 0) {
    return (
      <p>
        Откликов пока нет. Поставщики видят заявку в ленте «под заказ» — обычно первые ответы
        приходят за сутки-двое.
      </p>
    )
  }
  return (
    <div data-testid="bid-list">
      {bids.map((bid) => (
        <BidCard key={bid.id} bid={bid} />
      ))}
    </div>
  )
}
