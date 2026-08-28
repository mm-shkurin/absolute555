// Лента предложений по цене. Гостю она закрыта: чужой торг — это и есть то, ради чего
// стоит войти, и открытый список убрал бы единственную причину.
import type { OfferRow } from '../logic/listingDetail'
import styles from './SidePanel.module.css'

export function OffersBlock({ offers }: { offers: OfferRow[] | null }) {
  if (offers === null) {
    return (
      <div className={styles.locked} data-testid="offers-locked">
        <div className={styles.lockedLabel}>ЗАКРЫТО</div>
        Авторизуйтесь, чтобы увидеть предложения других покупателей
      </div>
    )
  }

  if (offers.length === 0) {
    return <p className={styles.hint}>Предложений пока нет — ваше будет первым.</p>
  }

  return (
    <div className={styles.offers} data-testid="offers">
      {offers.map((offer) => (
        <div key={offer.id} className={styles.offerRow}>
          <span>{offer.when}</span>
          <b>{offer.amount}</b>
        </div>
      ))}
    </div>
  )
}
