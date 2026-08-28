// Карточка ленты. Ссылка целиком, а не карточка с кнопкой внутри: средняя кнопка мыши и
// «открыть в новой вкладке» — обычный способ сравнивать машины.
import { Link } from 'react-router-dom'
import { Placeholder } from '../../../shared/ui/Placeholder'
import { ROUTES } from '../../../shared/navigation/routes'
import type { ListingView } from '../logic/listingView'
import styles from './ListingCard.module.css'

export function ListingCard({ listing }: { listing: ListingView }) {
  return (
    <Link to={ROUTES.listing(listing.id)} className={styles.card} data-testid="listing-card">
      <Placeholder className={styles.photo}>
        {listing.photoUrl ? <img src={listing.photoUrl} alt="" /> : 'фото автомобиля'}
        <div className={styles.badges}>
          {listing.hasThicknessMap ? (
            <span className={styles.badge}>полная карта замеров</span>
          ) : null}
          {listing.isImport ? (
            <span className={`${styles.badge} ${styles.import}`}>под заказ</span>
          ) : null}
        </div>
      </Placeholder>
      <div className={styles.body}>
        <div className={styles.title}>
          <b data-testid="listing-title">{listing.title}</b>
          <span>{listing.year}</span>
        </div>
        <div className={styles.price} data-testid="listing-price">
          {listing.price}
        </div>
        <div className={styles.spec}>{listing.spec}</div>
        <div className={styles.meta}>
          <span>{listing.city}</span>
          <span>{listing.vinNote}</span>
        </div>
      </div>
    </Link>
  )
}

export function ListingGrid({ listings }: { listings: ListingView[] }) {
  return (
    <div className={styles.cards} data-testid="listing-grid">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}
