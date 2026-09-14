// Левая колонка карточки: галерея, характеристики, описание, вход в карту замеров.
import type { ListingDetailView } from '../logic/listingDetail'
import { Gallery } from './Gallery'
import { SpecsBlock } from './SpecsBlock'
import { ThicknessTeaser } from './ThicknessTeaser'
import styles from '../listing.module.css'

interface ListingBodyProps {
  listing: ListingDetailView
  /** Не передан — объявление своё: на себя не жалуются. */
  onComplain?: () => void
}

export function ListingBody({ listing, onComplain }: ListingBodyProps) {
  return (
    <div>
      <Gallery photos={listing.photos} total={listing.photosTotal} />
      <SpecsBlock specs={listing.specs} />
      {listing.description ? (
        <div className={styles.block}>
          <h3>Описание</h3>
          <p className={styles.description}>{listing.description}</p>
        </div>
      ) : null}
      {listing.hasThicknessMap ? <ThicknessTeaser listing={listing} /> : null}
      {onComplain ? (
        <button
          type="button"
          className={styles.complain}
          onClick={onComplain}
          data-testid="listing-complain"
        >
          Пожаловаться на объявление
        </button>
      ) : null}
    </div>
  )
}
