import styles from '../selling.module.css'
import landing from './StepThickness.module.css'

export function ThicknessTiles() {
  return (
    <div className={styles.pair}>
      <div className={landing.tile}>
        <h3>Что нужно</h3>
        <p>
          Толщиномер — любой, даже самый дешёвый. Прикладываете к панели, фотографируете экран
          прибора, число считывается автоматически.
        </p>
      </div>
      <div className={landing.tile}>
        <h3>Сколько это займёт</h3>
        <p>
          13 панелей, примерно по 20 секунд каждая. Можно заполнить не всё и вернуться позже —
          частичная карта тоже показывается покупателю.
        </p>
      </div>
    </div>
  )
}
