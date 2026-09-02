// Левая колонка карточки: галерея, характеристики, описание, вход в карту замеров.
import { Link } from 'react-router-dom'
import { Placeholder } from '../../../shared/ui/Placeholder'
import { buttonClass } from '../../../shared/ui/Button'
import { ROUTES } from '../../../shared/navigation/routes'
import type { ListingDetailView } from '../logic/listingDetail'
import { Gallery } from './Gallery'
import { ThicknessBadge } from './ThicknessBadge'
import styles from '../listing.module.css'

export function ListingBody({ listing }: { listing: ListingDetailView }) {
  return (
    <div>
      <Gallery photos={listing.photos} total={listing.photosTotal} />

      <div className={styles.block}>
        <h3>Характеристики</h3>
        <div className={styles.specs}>
          {listing.specs.map((row) => (
            <div key={row.label}>
              <span>{row.label}</span>
              <b className={row.mono ? styles.vin : undefined}>{row.value}</b>
            </div>
          ))}
        </div>
      </div>

      {listing.description ? (
        <div className={styles.block}>
          <h3>Описание</h3>
          <p className={styles.description}>{listing.description}</p>
        </div>
      ) : null}

      {listing.hasThicknessMap ? (
        <div className={styles.block} data-testid="thickness-teaser">
          <div className={styles.blockHead}>
            <h3>Карта замеров</h3>
            <ThicknessBadge label={listing.thicknessBadge} />
          </div>
          <Placeholder className={styles.mapTeaser}>схема кузова с замерами</Placeholder>
          <Link
            to={ROUTES.thicknessMap(listing.id)}
            className={buttonClass({ tone: 'ghost', block: true })}
          >
            Открыть карту целиком
          </Link>
        </div>
      ) : null}
    </div>
  )
}
