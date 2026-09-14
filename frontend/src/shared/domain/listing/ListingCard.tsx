// Карточка ленты. Ссылка целиком, а не карточка с кнопкой внутри: средняя кнопка мыши и
// «открыть в новой вкладке» — обычный способ сравнивать машины.
import { Link } from 'react-router-dom'
import { Placeholder } from '../../ui/Placeholder'
import { ROUTES } from '../../navigation/routes'
import { ListingCardBody } from './ListingCardBody'
import type { ListingView } from './listingView'
import styles from './ListingCard.module.css'

export function ListingCard({ listing }: { listing: ListingView }) {
  return (
    <Link to={ROUTES.listing(listing.id)} className={styles.card} data-testid="listing-card">
      <Placeholder className={styles.photo}>
        {listing.photoUrl ? <img src={listing.photoUrl} alt="" /> : 'фото автомобиля'}
        <div className={styles.badges}>
          {listing.hasThicknessMap ? (
            <span className={styles.badge} data-badge="thickness">
              полная карта замеров
            </span>
          ) : null}
          {listing.isImport ? (
            <span className={`${styles.badge} ${styles.import}`} data-badge="import">
              под заказ
            </span>
          ) : null}
        </div>
      </Placeholder>
      <ListingCardBody listing={listing} />
    </Link>
  )
}

// Число колонок — проп, а не внешняя сетка вокруг: обёртка с собственным
// `grid-template-columns` делит уже поделённую колонку и сплющивает карточку до
// нескольких символов. Так уже вышло в профиле продавца и на витрине поставщика.
export function ListingGrid({ listings, columns }: { listings: ListingView[]; columns?: number }) {
  return (
    <div className={styles.cards} data-columns={columns} data-testid="listing-grid">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}
