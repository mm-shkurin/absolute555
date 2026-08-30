// Заявки на роль поставщика. Одобряет только владелец площадки: роль даёт право публиковать
// позиции без модерации, и раздавать её автоматом нельзя.
import { useQuery } from '@tanstack/react-query'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageHeading, PageSection } from '../../shared/ui/PageHeading'
import { EmptyNotice, FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { fetchRoleApplications } from './api/moderationApi'
import { toRoleApplication } from './logic/roleView'
import { RoleApplicationCard } from './components/RoleApplicationCard'

export function RoleApplicationsPage() {
  const query = useQuery({
    queryKey: ['role-applications'],
    queryFn: ({ signal }) => fetchRoleApplications(signal),
  })
  const applications = (query.data?.items ?? []).map(toRoleApplication)

  return (
    <>
      <SiteHeader signedIn />
      <main data-testid="role-applications">
        <Container>
          <PageSection>
            <PageHeading
              title="Заявки на роль поставщика"
              sub="Одобряет только владелец площадки. Одобренный публикует позиции сам."
            />
            {query.isPending ? <ListSkeleton rows={2} /> : null}
            {!query.isPending && query.error ? (
              <FailureNotice
                message={(query.error as Error).message}
                onRetry={() => void query.refetch()}
              />
            ) : null}
            {!query.isPending && !query.error && applications.length === 0 ? (
              <EmptyNotice title="Заявок нет">
                Никто не просит роль поставщика — форма открыта в профиле любого пользователя.
              </EmptyNotice>
            ) : null}
            {applications.map((application, index) => (
              <RoleApplicationCard
                key={application.id}
                application={application}
                first={index === 0}
                onApprove={() => undefined}
                onReject={() => undefined}
              />
            ))}
          </PageSection>
        </Container>
      </main>
    </>
  )
}
