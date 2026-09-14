// Правая колонка — всё про сделку. Три режима смотрящего различаются только этой колонкой,
// поэтому ветка одна и живёт здесь, а не расходится по трём копиям экрана.
import { Button } from '../../../shared/ui/Button'
import type { ListingDetailView, ViewerMode } from '../logic/listingDetail'
import { OffersBlock } from './OffersBlock'
import { SellerBlock } from './SellerBlock'
import { SideHead } from './SideHead'
import styles from './SidePanel.module.css'
import listing from '../listing.module.css'

export interface SideHandlers {
  onOffer: () => void
  onMessage: () => void
  onShowPhone: () => void
  onSignIn: () => void
  onComplain: () => void
}

interface SidePanelProps {
  view: ListingDetailView
  mode: ViewerMode
  offers: { id: string; when: string; amount: string }[] | null
  /** Раскрытый телефон продавца. До нажатия его нет ни на экране, ни в ответе карточки. */
  phone: string | null
  handlers: SideHandlers
}

export function SidePanel({ view, mode, offers, phone, handlers }: SidePanelProps) {
  return (
    <aside className={listing.side} data-testid="listing-side" data-mode={mode}>
      <SideHead view={view} mode={mode} phone={phone} handlers={handlers} />
      <div className={listing.block}>
        <h3>Предложения по цене</h3>
        <OffersBlock offers={offers} mode={mode} />
      </div>
      <SellerBlock view={view} />
    </aside>
  )
}

interface MobileActionBarProps {
  mode: ViewerMode
  handlers: SideHandlers
}

export function MobileActionBar({ mode, handlers }: MobileActionBarProps) {
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
