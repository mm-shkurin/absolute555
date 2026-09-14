// Сводка: где сейчас затор. Первый экран кабинета — не потому что красиво начинать с
// цифр, а потому что модератор приходит сюда не за конкретным объявлением: ему нужно
// знать, куда идти сегодня.
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { QueryStates } from '../../shared/ui/QueryStates'
import { fetchCounts } from '../../shared/api/backend/moderationApi'
import { fetchRoleApplications } from './api/moderationApi'
import { ModerationPage } from './components/ModerationPage'
import { buildSummaryTiles, type SummaryTile } from './logic/summaryTiles'
import styles from './summary.module.css'

export function AdminSummaryPage() {
  const counts = useQuery({
    queryKey: ['moderation-counts'],
    queryFn: ({ signal }) => fetchCounts(signal),
  })
  // Заявки считаются по самой выдаче: отдельного счётчика у сервера нет, а нерешённых
  // заявок единицы — страница за ними всё равно уже загружается на соседнем разделе.
  const applications = useQuery({
    queryKey: ['role-applications', 'pending'],
    queryFn: ({ signal }) => fetchRoleApplications('pending', signal),
  })

  return (
    <ModerationPage testId="admin-summary" title="Сводка" sub="Что сейчас ждёт разбора">
      <QueryStates
        query={counts}
        isEmpty={false}
        skeletonRows={3}
        failureMessage="Не удалось получить сводку"
      />
      {counts.isSuccess ? (
        <SummaryTiles tiles={buildSummaryTiles(counts.data, applications.data?.length ?? 0)} />
      ) : null}
    </ModerationPage>
  )
}

function SummaryTiles({ tiles }: { tiles: SummaryTile[] }) {
  return (
    <div className={styles.tiles} data-testid="admin-tiles">
      {tiles.map((tile) => (
        // Число — ссылка, а не текст: увидеть затор и не иметь возможности нажать на
        // него значит заставить человека искать раздел глазами.
        <Link key={tile.label} to={tile.to} className={styles.tile}>
          <b className={styles.value}>{tile.value}</b>
          <span className={styles.label}>{tile.label}</span>
          <small className={styles.hint}>{tile.hint}</small>
        </Link>
      ))}
    </div>
  )
}
