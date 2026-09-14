import { Link } from 'react-router-dom'
import { buttonClass } from '../../../shared/ui/Button'
import { ROUTES } from '../../../shared/navigation/routes'
import type { ListingDetailView } from '../logic/listingDetail'
import styles from './OwnerPanel.module.css'
import listing from '../listing.module.css'

interface OwnerThicknessProps {
  view: ListingDetailView
}

export function OwnerThickness({ view }: OwnerThicknessProps) {
  const complete = view.measuredPanels === view.totalPanels
  return (
    <div className={listing.block}>
      <h3>Карта замеров</h3>
      <div className={styles.progressRow}>
        <span>Заполнено</span>
        <b>
          {view.measuredPanels} из {view.totalPanels}
        </b>
      </div>
      <div className={styles.progress}>
        <i style={{ width: `${view.thicknessPercent}%` }} />
      </div>
      <p className={styles.note}>
        {complete
          ? 'Карта полная — объявление получает бейдж и поднимается в выдаче.'
          : `Не замерено панелей: ${view.totalPanels - view.measuredPanels} — бейджа «полная карта» нет, объявление не поднимается в выдаче.`}
      </p>
      <Link
        // Домерить — это редактор, а он живёт на экране продавца: карта объявления
        // только показывает замеры, и владелец попадал туда, где записать нечего.
        to={complete ? ROUTES.thicknessMap(view.id) : ROUTES.sellingThickness(view.id)}
        className={buttonClass({ tone: 'ghost', block: true, className: styles.mapLink })}
      >
        {complete ? 'Посмотреть карту' : 'Домерить'}
      </Link>
    </div>
  )
}
