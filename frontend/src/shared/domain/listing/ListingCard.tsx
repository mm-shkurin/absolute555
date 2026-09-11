// Карточка ленты. Ссылка целиком, а не карточка с кнопкой внутри: средняя кнопка мыши и
// «открыть в новой вкладке» — обычный способ сравнивать машины.
import { Link } from 'react-router-dom'
import { Placeholder } from '../../ui/Placeholder'
import { ROUTES } from '../../navigation/routes'
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
      <div className={styles.body}>
        <div className={styles.title}>
          <b data-testid="listing-title">{listing.title}</b>
          <span>{listing.year}</span>
        </div>
        <div className={styles.price} data-testid="listing-price">
          {listing.price}
        </div>
        {listing.turnkey ? (
          <div className={styles.turnkey} data-testid="listing-turnkey">
            {listing.turnkey}
          </div>
        ) : null}
        <div className={styles.spec}>{listing.spec}</div>
        <div className={styles.meta}>
          <span>{listing.isImport && listing.importFrom ? listing.importFrom : listing.city}</span>
          <span>{listing.vinNote}</span>
        </div>
        {listing.paintStrip.length > 0 ? (
          <div className={styles.paintStrip} data-testid="paint-strip" aria-label="Карта окрасов">
            {listing.paintStrip.map((color, index) => (
              <i key={index} style={{ background: color }} />
            ))}
          </div>
        ) : null}
      </div>
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
