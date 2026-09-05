// Лента предложений по цене.
//
// Закрыта она двум разным людям и по разным причинам, а текст был один — и вошедшему
// покупателю предлагал авторизоваться, хотя он уже вошёл. Гостю закрыт вход: чужой торг
// и есть повод войти. Вошедшему чужие предложения не отдаёт сервер — их видит только
// продавец (история 10), и звать его «авторизоваться» значит обещать то, чего вход
// не даст.
import type { OfferRow, ViewerMode } from '../logic/listingDetail'
import styles from './SidePanel.module.css'

export function OffersBlock({ offers, mode }: { offers: OfferRow[] | null; mode: ViewerMode }) {
  if (offers === null) {
    return (
      <div className={styles.locked} data-testid="offers-locked">
        <div className={styles.lockedLabel}>ЗАКРЫТО</div>
        {mode === 'guest'
          ? 'Авторизуйтесь, чтобы увидеть предложения других покупателей'
          : 'Предложения других покупателей видит только продавец'}
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
