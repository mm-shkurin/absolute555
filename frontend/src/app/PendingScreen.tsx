interface PendingScreenProps {
  screen: string
}

// Заглушка до появления первой фичи. Ровно одна, названная заглушкой: несколько
// «временных» пустых компонентов расползаются по кодовой базе и переживают всех.
export function PendingScreen({ screen }: PendingScreenProps) {
  return (
    <main style={{ padding: '48px 24px' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
        КАРКАС
      </p>
      <h1 style={{ fontSize: 28, marginTop: 8 }}>{screen}</h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
        Экран ещё не перенесён из мокапа. Разметка — в{' '}
        <code>ProductSpecification/ui/mockups/index.html</code>.
      </p>
    </main>
  )
}
