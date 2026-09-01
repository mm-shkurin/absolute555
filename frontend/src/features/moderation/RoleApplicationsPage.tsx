// Заявки на роль поставщика. Одобряет только владелец площадки: роль даёт право публиковать
// позиции без модерации, и раздавать её автоматом нельзя.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageHeading, PageSection } from '../../shared/ui/PageHeading'
import { EmptyNotice, FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { answerRoleApplication, fetchRoleApplications } from './api/moderationApi'
import type { RoleRequestDecision } from '../../shared/api/backend/accountContract'
import { toRoleApplication } from './logic/roleView'
import { RoleApplicationCard } from './components/RoleApplicationCard'

interface Answer {
  id: string
  decision: RoleRequestDecision
}

export function RoleApplicationsPage() {
  const client = useQueryClient()
  const query = useQuery({
    queryKey: ['role-applications'],
    queryFn: ({ signal }) => fetchRoleApplications(signal),
  })
  const applications = (query.data ?? []).map(toRoleApplication)

  const answer = useMutation({
    mutationFn: ({ id, decision }: Answer) => answerRoleApplication(id, decision),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['role-applications'] }),
  })

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
            {answer.error ? (
              <FailureNotice
                message={(answer.error as Error).message}
                onRetry={() => answer.reset()}
              />
            ) : null}
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
                busy={answer.isPending}
                onApprove={() =>
                  answer.mutate({ id: application.id, decision: { status: 'approved' } })
                }
                onReject={(reason) =>
                  answer.mutate({
                    id: application.id,
                    decision: { status: 'rejected', review_comment: reason },
                  })
                }
              />
            ))}
          </PageSection>
        </Container>
      </main>
    </>
  )
}
