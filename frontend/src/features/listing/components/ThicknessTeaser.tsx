import { Link } from 'react-router-dom'
import { buttonClass } from '../../../shared/ui/Button'
import { ROUTES } from '../../../shared/navigation/routes'
import type { ListingDetailView } from '../logic/listingDetail'
import { MapTeaser } from './MapTeaser'
import { ThicknessBadge } from './ThicknessBadge'
import styles from '../listing.module.css'

interface ThicknessTeaserProps {
  listing: ListingDetailView
}

export function ThicknessTeaser({ listing }: ThicknessTeaserProps) {
  return (
    <div className={styles.block} data-testid="thickness-teaser">
      <div className={styles.blockHead}>
        <h3>Карта замеров</h3>
        <ThicknessBadge label={listing.thicknessBadge} />
      </div>
      <MapTeaser listingId={listing.id} />
      <Link
        to={ROUTES.thicknessMap(listing.id)}
        className={buttonClass({ tone: 'ghost', block: true })}
      >
        Открыть карту целиком
      </Link>
    </div>
  )
}
