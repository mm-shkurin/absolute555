import { Link } from 'react-router-dom'
import { buttonClass } from '../../../shared/ui/Button'
import { ROUTES } from '../../../shared/navigation/routes'
import type { ListingDetailView } from '../logic/listingDetail'
import styles from './SidePanel.module.css'
import listing from '../listing.module.css'

export function SellerBlock({ view }: { view: ListingDetailView }) {
  return (
    <div className={listing.block} data-testid="seller-block">
      <div className={styles.seller}>
        <div className={styles.avatar} />
        <div>
          <div className={styles.sellerName}>{view.sellerName}</div>
          <div className={styles.rating}>
            {view.sellerStars} <span>{view.sellerRating}</span>
          </div>
        </div>
      </div>
      <Link
        to={ROUTES.seller(view.sellerId)}
        className={buttonClass({ tone: 'ghost', block: true, className: styles.sellerLink })}
      >
        Профиль и другие объявления
      </Link>
    </div>
  )
}
