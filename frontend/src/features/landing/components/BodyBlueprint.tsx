// Чертёж кузова в герое: вид сбоку и вид сверху, панели залиты цветами шкалы замеров.
// Иллюстрация, а не данные — интерактивная карта живёт на своём экране; здесь она объясняет
// за один взгляд, что именно продукт показывает вместо «не бит не крашен».
import { BlueprintSide, BlueprintTop } from './BlueprintViews'
import styles from './BodyBlueprint.module.css'

export function BodyBlueprint() {
  return (
    <svg viewBox="0 0 460 330" role="img" aria-label="Схема кузова с замерами толщины краски">
      <BlueprintSide />
      <BlueprintTop />
      <text className={styles.caption} x="18" y="186">
        БОК
      </text>
      <text className={styles.caption} x="18" y="326">
        СВЕРХУ
      </text>
    </svg>
  )
}
