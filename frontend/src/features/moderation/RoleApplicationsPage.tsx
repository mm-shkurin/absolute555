// Заявки на роль поставщика. Одобряет только владелец площадки: роль даёт право публиковать
// позиции без модерации, и раздавать её автоматом нельзя.
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageHeading, PageSection } from '../../shared/ui/PageHeading'
import { ModerationNav } from './components/ModerationNav'
import { EmptyNotice, FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { PillTabs } from '../../shared/ui/PillTabs'
import { answerRoleApplication, fetchRoleApplications, type RoleTab } from './api/moderationApi'
import type { RoleRequestDecision } from '../../shared/api/backend/accountContract'
import { toRoleApplication } from './logic/roleView'
import { canReviewRoleRequests } from '../../shared/session/authSession'
import { RoleApplicationCard } from './components/RoleApplicationCard'

// Пустая вкладка называет себя: «заявок нет» на трёх вкладках значит три разные вещи.
const EMPTY: Record<RoleTab, string> = {
  pending: 'Нерешённых заявок нет',
  approved: 'Пока никого не одобрили',
  rejected: 'Отклонённых заявок нет',
}

interface Answer {
  id: string
  decision: RoleRequestDecision
}

export function RoleApplicationsPage() {
  const client = useQueryClient()
  const [tab, setTab] = useState<RoleTab>('pending')
  const query = useQuery({
    queryKey: ['role-applications', tab],
    queryFn: ({ signal }) => fetchRoleApplications(tab, signal),
  })
  const applications = (query.data ?? []).map(toRoleApplication)
  // Роль здесь для показа, а не для запрета: право проверяет сервер. Кнопка у того, кто
  // решать не может, стоила бы человеку нажатия и отказа.
  const mayDecide = canReviewRoleRequests()

  const answer = useMutation({
    mutationFn: ({ id, decision }: Answer) => answerRoleApplication(id, decision),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['role-applications'] }),
  })

  return (
    <>
      <SiteHeader signedIn />
      <main data-testid="role-applications">
        <Container>
          <ModerationNav />
          <PageSection>
            <PageHeading
              title="Заявки на роль поставщика"
              sub="Одобряет только владелец площадки. Одобренный публикует позиции сам."
            />
            <PillTabs
              current={tab}
              onSelect={setTab}
              tabs={[
                { id: 'pending', label: 'Ждут решения' },
                { id: 'approved', label: 'Одобренные' },
                { id: 'rejected', label: 'Отклонённые' },
              ]}
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
              <EmptyNotice title={EMPTY[tab]}>
                Форма заявки открыта в профиле любого вошедшего.
              </EmptyNotice>
            ) : null}
            {applications.map((application, index) => (
              <RoleApplicationCard
                key={application.id}
                application={application}
                first={index === 0}
                busy={answer.isPending || !mayDecide}
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
