// Отклики поставщиков. Самый дешёвый помечен, но не поднят наверх: порядок откликов —
// хронология, а перестановка по цене выдавала бы дешёвое за лучшее.
import { Avatar, Rating } from '../../../shared/ui/Avatar'
import { Button } from '../../../shared/ui/Button'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import type { BidView } from '../logic/requestView'
import styles from '../request.module.css'

export function BidList({ bids, onWrite }: { bids: BidView[]; onWrite: (bid: BidView) => void }) {
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
        <div key={bid.id} className={styles.bid} data-testid="bid">
          <Avatar size={40} />
          <div>
            <div className={styles.bidName}>{bid.name}</div>
            <Rating rating={bid.rating}>{bid.ratingLine}</Rating>
            <div className={styles.bidComment}>{bid.comment}</div>
          </div>
          <div className={styles.bidRight}>
            <div className={styles.bidPrice}>{bid.price}</div>
            <div className={styles.bidTerms}>{bid.terms}</div>
            {bid.cheapest ? (
              <div className={styles.cheapest}>
                <StatusBadge tone="info">дешевле остальных</StatusBadge>
              </div>
            ) : null}
            <Button size="small" className={styles.bidAction} onClick={() => onWrite(bid)}>
              Написать
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
