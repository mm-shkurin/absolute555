// Сводка: где сейчас затор. Первый экран кабинета — не потому что красиво начинать с
// цифр, а потому что модератор приходит сюда не за конкретным объявлением: ему нужно
// знать, куда идти сегодня.
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageHeading, PageSection } from '../../shared/ui/PageHeading'
import { FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { ROUTES } from '../../shared/navigation/routes'
import { fetchCounts } from '../../shared/api/backend/moderationApi'
import { fetchRoleApplications } from './api/moderationApi'
import { ModerationNav } from './components/ModerationNav'
import styles from './summary.module.css'

interface Tile {
  label: string
  value: number
  to: string
  hint: string
}

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

  if (counts.isPending)
    return (
      <Frame>
        <ListSkeleton rows={3} />
      </Frame>
    )
  if (counts.isError) {
    return (
      <Frame>
        <FailureNotice
          message="Не удалось получить сводку"
          onRetry={() => void counts.refetch()}
        />
      </Frame>
    )
  }

  const tiles: Tile[] = [
    {
      label: 'Ждут проверки',
      value: counts.data.waiting,
      to: ROUTES.moderationQueue,
      hint: 'Объявления, отправленные продавцами',
    },
    {
      label: 'С жалобами',
      value: counts.data.complained,
      to: ROUTES.moderationComplaints,
      hint: 'На них пожаловались читатели',
    },
    {
      label: 'Заявки на роль',
      value: applications.data?.length ?? 0,
      to: ROUTES.moderationRoles,
      hint: 'Ждут решения',
    },
    {
      label: 'Разобрано сегодня',
      value: counts.data.handled_today,
      to: ROUTES.moderationQueue,
      hint: 'Уже закрытые за сутки',
    },
  ]

  return (
    <Frame>
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
    </Frame>
  )
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader signedIn />
      <main data-testid="admin-summary">
        <Container>
          <ModerationNav />
          <PageSection>
            <PageHeading title="Сводка" sub="Что сейчас ждёт разбора" />
            {children}
          </PageSection>
        </Container>
      </main>
    </>
  )
}