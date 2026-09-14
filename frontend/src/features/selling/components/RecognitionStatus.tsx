import styles from './StepDocument.module.css'

export function RecognitionStatus() {
  return (
    <div>
      <div className={styles.working}>
        <span className={styles.spinner} /> Читаем текст и разбираем VIN
      </div>
      <div className={styles.progress}>
        <i style={{ width: '48%' }} />
      </div>
      <p className={styles.dropHint}>Обычно занимает 10–40 секунд.</p>
    </div>
  )
}
