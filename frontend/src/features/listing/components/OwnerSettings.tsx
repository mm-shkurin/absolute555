import { Switch } from '../../../shared/ui/Form'
import type { ListingDetailView } from '../logic/listingDetail'
import listing from '../listing.module.css'

interface OwnerSettingsProps {
  view: ListingDetailView
  onSetting: (key: 'phone' | 'chat', value: boolean) => void
  onOffersVisible: (value: boolean) => void
}

export function OwnerSettings({ view, onSetting, onOffersVisible }: OwnerSettingsProps) {
  return (
    <div className={listing.block}>
      <h3>Настройки объявления</h3>
      <Switch checked={view.phoneAvailable} onChange={(value) => onSetting('phone', value)}>
        Показывать телефон
      </Switch>
      <Switch checked={view.chatAllowed} onChange={(value) => onSetting('chat', value)}>
        Разрешить чат
      </Switch>
      {/* Чужой торг по умолчанию виден только продавцу: открыть его — его решение. */}
      <Switch checked={view.offersVisible} onChange={onOffersVisible}>
        Показывать предложения покупателям
      </Switch>
    </div>
  )
}
