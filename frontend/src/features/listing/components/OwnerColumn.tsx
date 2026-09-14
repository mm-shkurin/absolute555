import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../../shared/navigation/routes'
import type { ListingDetailView } from '../logic/listingDetail'
import type { ListingActions } from '../useListingActions'
import { OwnerPanel } from './OwnerPanel'

interface OwnerColumnProps {
  view: ListingDetailView
  sold: boolean
  actions: ListingActions
}

export function OwnerColumn({ view, sold, actions }: OwnerColumnProps) {
  const navigate = useNavigate()
  return (
    <OwnerPanel
      view={view}
      sold={sold}
      // В мастер этого объявления, а не в новое: `/sell` заводил бы новый черновик.
      onEdit={() => navigate(ROUTES.sellingDraft(view.id))}
      busy={actions.busy}
      onUnpublish={() => actions.owner('withdraw')}
      onMarkSold={() => actions.owner('sold')}
      onSetting={(key, value) =>
        actions.setting(key === 'phone' ? { phone_visible: value } : { chat_allowed: value })
      }
      onOffersVisible={(value) => actions.setting({ offers_visible: value })}
    />
  )
}
