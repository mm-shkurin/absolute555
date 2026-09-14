import type { ListingDetailView, ViewerMode } from '../logic/listingDetail'
import { PriceActions } from './PriceActions'
import type { SideHandlers } from './SidePanel'
import styles from './SidePanel.module.css'
import listing from '../listing.module.css'

interface SideHeadProps {
  view: ListingDetailView
  mode: ViewerMode
  phone: string | null
  handlers: SideHandlers
}

export function SideHead({ view, mode, phone, handlers }: SideHeadProps) {
  return (
    <div className={`${listing.block} ${listing.blockFirst}`}>
      <div className={styles.head}>
        <div>
          <div className={styles.title}>{view.title}</div>
          <div className={styles.summary}>{view.summary}</div>
        </div>
        <button
          type="button"
          className={styles.more}
          title="Пожаловаться"
          onClick={handlers.onComplain}
        >
          ⋯
        </button>
      </div>
      <div className={styles.price} data-testid="listing-price">
        {view.price}
      </div>
      <PriceActions view={view} mode={mode} handlers={handlers} />
      {phone ? (
        <div className={styles.phone} data-testid="revealed-phone">
          {phone}
        </div>
      ) : null}
    </div>
  )
}
