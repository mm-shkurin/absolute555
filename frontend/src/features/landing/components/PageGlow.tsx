// Фон лендинга: размытые синие пятна, белая пелена под ними и чертёжная сетка героя.
// Декорация целиком — для скринридера её нет.
import styles from './PageGlow.module.css'

export function PageGlow() {
  return (
    <div className={styles.background} aria-hidden="true">
      <span className={`${styles.blob} ${styles.b1}`} />
      <span className={`${styles.blob} ${styles.b2}`} />
      <span className={`${styles.blob} ${styles.b3}`} />
      <span className={`${styles.blob} ${styles.b4}`} />
      <span className={styles.veil} />
    </div>
  )
}
