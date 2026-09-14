import { Link } from 'react-router-dom'
import { Avatar } from '../../../shared/ui/Avatar'
import { ROUTES } from '../../../shared/navigation/routes'
import { ButtonLink } from '../../../shared/ui/Button'
import { StatusBadge } from '../../../shared/ui/StatusBadge'
import type { BidView } from '../logic/requestView'
import styles from '../request.module.css'

interface BidCardProps {
  bid: BidView
}

export function BidCard({ bid }: BidCardProps) {
  return (
    <div className={styles.bid} data-testid="bid">
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
  )
}
