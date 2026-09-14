import { Shot } from './Shot'
import {
  HERO_LISTING,
  HERO_MEASURE,
  HERO_PANELS,
  HERO_SELLER,
  HERO_SPEC,
  HERO_VIN,
} from '../content/heroTile'
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

export function HeroMainTile() {
  return (
    <article className={`${styles.tile} ${styles.main}`}>
      <span className={styles.badge}>{HERO_LISTING.badge}</span>
      <Shot
        className={styles.shot}
        src="/design/landing/hero-camry.jpg"
        alt="Toyota Camry 2019 в три четверти"
      />
      <div className={styles.meta}>
        <div>
          <span className={styles.label}>{HERO_LISTING.place}</span>
          <div className={styles.title}>{HERO_LISTING.title}</div>
        </div>
        <span className={styles.price}>{HERO_LISTING.price}</span>
      </div>
    </article>
  )
}

export function HeroMeasureTile() {
  return (
    <article className={styles.tile}>
      <span className={styles.label}>{HERO_MEASURE.panel}</span>
      <div className={styles.value}>{HERO_MEASURE.value}</div>
      <div className={styles.note}>{HERO_MEASURE.caption}</div>
      <PanelBar />
    </article>
  )
}

export function HeroVinTile() {
  return (
    <article className={styles.tile}>
      <span className={styles.label}>VIN из фото СТС</span>
      <div className={styles.vin}>
        {HERO_VIN.head}
        <span className={styles.masked}>{HERO_VIN.hidden}</span>
        {HERO_VIN.tail}
      </div>
      <div className={styles.note}>{HERO_SPEC}</div>
    </article>
  )
}

export function HeroBodyTile() {
  return (
    <article className={styles.tile}>
      <span className={styles.label}>Кузов · 11 панелей</span>
      <img
        className={styles.bodyMap}
        src="/design/landing/body-paint-map.png"
        alt="Кузов сбоку: зелёные панели — заводская краска, оранжевые перекрашены, красная в толстом слое"
        loading="lazy"
        decoding="async"
      />
    </article>
  )
}

export function HeroSellerTile() {
  return (
    <article className={styles.tile}>
      <span className={styles.label}>Продавец</span>
      <div className={styles.stars}>{HERO_SELLER.stars}</div>
      <div className={styles.title}>{HERO_SELLER.title}</div>
      <div className={styles.note}>{HERO_SELLER.note}</div>
    </article>
  )
}
