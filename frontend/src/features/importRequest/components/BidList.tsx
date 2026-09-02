// Отклики поставщиков. Самый дешёвый помечен, но не поднят наверх: порядок откликов —
// хронология, а перестановка по цене выдавала бы дешёвое за лучшее.
import { Link } from 'react-router-dom'
import { Avatar } from '../../../shared/ui/Avatar'
import { ROUTES } from '../../../shared/navigation/routes'
import { ButtonLink } from '../../../shared/ui/Button'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import type { BidView } from '../logic/requestView'
import styles from '../request.module.css'

export function BidList({ bids }: { bids: BidView[] }) {
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
            {/* Имени поставщика в отклике сервер не отдаёт — только идентификатор.
                Ссылка ведёт на его витрину, где имя, рейтинг и условия и живут. */}
            <Link className={styles.bidName} to={ROUTES.supplier(bid.supplierId)}>
              Поставщик
            </Link>
            {bid.comment ? <div className={styles.bidComment}>{bid.comment}</div> : null}
          </div>
          <div className={styles.bidRight}>
            <div className={styles.bidPrice}>{bid.price}</div>
            <div className={styles.bidTerms}>{bid.terms}</div>
            {bid.cheapest ? (
              <div className={styles.cheapest}>
                <StatusBadge tone="info">дешевле остальных</StatusBadge>
              </div>
            ) : null}
            {/* Переписка с поставщиком идёт в общем чате — отдельного канала под
                отклики контракт не заводит. */}
            <ButtonLink size="small" className={styles.bidAction} to={ROUTES.chats}>
              Написать
            </ButtonLink>
          </div>
        </div>
      ))}
    </div>
  )
}
