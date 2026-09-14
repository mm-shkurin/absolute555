// Объявление, разобранное на плитки: сетка 4×2 из главной карточки и четырёх фактов.
// Лендинг не рассказывает про продукт словами, а показывает то, что в нём уже лежит.
import {
  HeroBodyTile,
  HeroMainTile,
  HeroMeasureTile,
  HeroSellerTile,
  HeroVinTile,
} from './HeroTiles'
import styles from './HeroBento.module.css'

export function HeroBento() {
  return (
    <div className={styles.bento} data-testid="hero-bento">
      <HeroMainTile />
      <HeroMeasureTile />
      <HeroVinTile />
      <HeroBodyTile />
      <HeroSellerTile />
    </div>
  )
}
