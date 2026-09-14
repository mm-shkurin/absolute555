// Правая колонка своего объявления. Вместо кнопок торга — счётчики и управление: владельцу
// нужно понять, смотрят ли карточку, и что сделать, если нет.
import type { ListingDetailView } from '../logic/listingDetail'
import { OwnerControls } from './OwnerControls'
import { OwnerHeadline } from './OwnerHeadline'
import { OwnerSettings } from './OwnerSettings'
import { OwnerThickness } from './OwnerThickness'
import listing from '../listing.module.css'

interface OwnerPanelProps {
  view: ListingDetailView
  sold: boolean
  busy?: boolean
  onEdit: () => void
  onUnpublish: () => void
  onMarkSold: () => void
  onSetting: (key: 'phone' | 'chat', value: boolean) => void
  onOffersVisible: (value: boolean) => void
}

export function OwnerPanel({
  view,
  sold,
  busy,
  onSetting,
  onOffersVisible,
  ...controls
}: OwnerPanelProps) {
  return (
    <aside className={listing.side} data-testid="owner-panel">
      <div className={`${listing.block} ${listing.blockFirst}`}>
        <OwnerHeadline view={view} sold={sold} />
        {sold ? null : <OwnerControls busy={busy} {...controls} />}
      </div>
      <OwnerThickness view={view} />
      <OwnerSettings view={view} onSetting={onSetting} onOffersVisible={onOffersVisible} />
    </aside>
  )
}
