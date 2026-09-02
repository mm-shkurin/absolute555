// Правая колонка — всё про сделку. Три режима смотрящего различаются только этой колонкой,
// поэтому ветка одна и живёт здесь, а не расходится по трём копиям экрана.
import { Button } from '../../../shared/ui/Button'
import type { ListingDetailView, ViewerMode } from '../logic/listingDetail'
import { PriceActions } from './PriceActions'
import { OffersBlock } from './OffersBlock'
import { SellerBlock } from './SellerBlock'
import styles from './SidePanel.module.css'
import listing from '../listing.module.css'

export interface SideHandlers {
  onOffer: () => void
  onMessage: () => void
  onShowPhone: () => void
  onSignIn: () => void
  onComplain: () => void
}

interface Props {
  view: ListingDetailView
  mode: ViewerMode
  offers: { id: string; when: string; amount: string }[] | null
  /** Раскрытый телефон продавца. До нажатия его нет ни на экране, ни в ответе карточки. */
  phone: string | null
  handlers: SideHandlers
}

export function SidePanel({ view, mode, offers, phone, handlers }: Props) {
  return (
    <aside className={listing.side} data-testid="listing-side" data-mode={mode}>
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

      <div className={listing.block}>
        <h3>Предложения по цене</h3>
        <OffersBlock offers={offers} />
      </div>

      <SellerBlock view={view} />
    </aside>
  )
}

export function MobileActionBar({ mode, handlers }: { mode: ViewerMode; handlers: SideHandlers }) {
  if (mode === 'sold') {
    return (
      <div className={styles.mobileBar} data-testid="mobile-actions">
        <Button tone="ghost" block disabled>
          Машина продана
        </Button>
      </div>
    )
  }
  return (
    <div className={styles.mobileBar} data-testid="mobile-actions">
      <Button tone="ghost" onClick={mode === 'guest' ? handlers.onSignIn : handlers.onMessage}>
        Написать
      </Button>
      <Button onClick={mode === 'guest' ? handlers.onSignIn : handlers.onOffer}>
        Предложить цену
      </Button>
    </div>
  )
}
