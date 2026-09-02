// Объявление, разобранное на плитки: сетка 4×2 из главной карточки и четырёх фактов.
// Лендинг не рассказывает про продукт словами, а показывает то, что в нём уже лежит.
import { Placeholder } from '../../../shared/ui/Placeholder'
import {
  HERO_LISTING,
  HERO_MEASURE,
  HERO_PANELS,
  HERO_SELLER,
  HERO_SPEC,
  HERO_VIN,
} from '../content/heroTile'
import { BodySilhouette } from './BodySilhouette'
import styles from './HeroBento.module.css'

function PanelBar() {
  return (
    <span className={styles.bar}>
      {HERO_PANELS.map((panel, index) => (
        <i key={index} className={styles[panel.state]} />
      ))}
    </span>
  )
}

export function HeroBento() {
  return (
    <div className={styles.bento} data-testid="hero-bento">
      <article className={`${styles.tile} ${styles.main}`}>
        <span className={styles.badge}>{HERO_LISTING.badge}</span>
        <Placeholder className={styles.shot}>фотография машины</Placeholder>
        <div className={styles.meta}>
          <div>
            <span className={styles.label}>{HERO_LISTING.place}</span>
            <div className={styles.title}>{HERO_LISTING.title}</div>
          </div>
          <span className={styles.price}>{HERO_LISTING.price}</span>
        </div>
      </article>

      <article className={styles.tile}>
        <span className={styles.label}>{HERO_MEASURE.panel}</span>
        <div className={styles.value}>{HERO_MEASURE.value}</div>
        <div className={styles.note}>{HERO_MEASURE.caption}</div>
        <PanelBar />
      </article>

      <article className={styles.tile}>
        <span className={styles.label}>VIN из фото СТС</span>
        <div className={styles.vin}>
          {HERO_VIN.head}
          <span className={styles.masked}>{HERO_VIN.hidden}</span>
          {HERO_VIN.tail}
        </div>
        <div className={styles.note}>{HERO_SPEC}</div>
      </article>

      <article className={styles.tile}>
        <span className={styles.label}>Кузов · 11 панелей</span>
        <BodySilhouette />
      </article>

      <article className={styles.tile}>
        <span className={styles.label}>Продавец</span>
        <div className={styles.stars}>{HERO_SELLER.stars}</div>
        <div className={styles.title}>{HERO_SELLER.title}</div>
        <div className={styles.note}>{HERO_SELLER.note}</div>
      </article>
    </div>
  )
}
