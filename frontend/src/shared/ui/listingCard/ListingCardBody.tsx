import type { ListingView } from '../../domain/listing/listingView'
import styles from './ListingCard.module.css'

export function ListingCardBody({ listing }: { listing: ListingView }) {
  return (
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
      <PaintStrip colors={listing.paintStrip} />
    </div>
  )
}

function PaintStrip({ colors }: { colors: string[] }) {
  if (colors.length === 0) return null
  return (
    <div className={styles.paintStrip} data-testid="paint-strip" aria-label="Карта окрасов">
      {colors.map((color, index) => (
        <i key={index} style={{ background: color }} />
      ))}
    </div>
  )
}
