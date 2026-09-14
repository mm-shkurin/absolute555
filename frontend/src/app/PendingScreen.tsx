import styles from './PendingScreen.module.css'

interface PendingScreenProps {
  screen: string
}

// Заглушка до появления первой фичи. Ровно одна, названная заглушкой: несколько
// «временных» пустых компонентов расползаются по кодовой базе и переживают всех.
export function PendingScreen({ screen }: PendingScreenProps) {
  return (
    <main className={styles.screen}>
      <p className={styles.eyebrow}>КАРКАС</p>
      <h1 className={styles.title}>{screen}</h1>
      <p className={styles.note}>
        Экран ещё не перенесён из мокапа. Разметка — в{' '}
        <code>ProductSpecification/ui/mockups/index.html</code>.
      </p>
    </main>
  )
}
