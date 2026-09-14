// Заявки на роль поставщика. Одобряет только владелец площадки: роль даёт право публиковать
// позиции без модерации, и раздавать её автоматом нельзя.
import { useCallback, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { EmptyNotice } from '../../shared/ui/ListStates'
import { PillTabs } from '../../shared/ui/PillTabs'
import { MutationFailure, QueryStates } from '../../shared/ui/QueryStates'
import { answerRoleRequest, fetchRoleRequests } from '../../shared/api/backend/accountApi'
import type { RoleTab } from './api/moderationApi'
import type { RoleRequestDecision } from '../../shared/api/backend/accountContract'
import { toRoleApplication, type RoleApplicationView } from './logic/roleView'
import { canReviewRoleRequests } from '../../shared/session/authSession'
import { ModerationPage } from './components/ModerationPage'
import { RoleApplicationCard } from './components/RoleApplicationCard'

// Пустая вкладка называет себя: «заявок нет» на трёх вкладках значит три разные вещи.
const EMPTY: Record<RoleTab, string> = {
  pending: 'Нерешённых заявок нет',
  approved: 'Пока никого не одобрили',
  rejected: 'Отклонённых заявок нет',
}

const TABS: { id: RoleTab; label: string }[] = [
  { id: 'pending', label: 'Ждут решения' },
  { id: 'approved', label: 'Одобренные' },
  { id: 'rejected', label: 'Отклонённые' },
]

const SUB =
  'Одобряет только владелец площадки. Одобренный получает роль и уже потом отправляет витрину на проверку — в соседний раздел.'

export function RoleApplicationsPage() {
  const [tab, setTab] = useState<RoleTab>('pending')
  const query = useQuery({
    queryKey: ['role-applications', tab],
    queryFn: ({ signal }) => fetchRoleRequests(tab, signal),
  })
  const applications = (query.data ?? []).map(toRoleApplication)
  // Роль здесь для показа, а не для запрета: право проверяет сервер. Кнопка у того, кто
  // решать не может, стоила бы человеку нажатия и отказа.
  const mayDecide = canReviewRoleRequests()
  const answer = useRoleAnswer()

  return (
    <ModerationPage testId="role-applications" title="Заявки в поставщики" sub={SUB}>
      <PillTabs current={tab} onSelect={setTab} tabs={TABS} />
      <MutationFailure error={answer.error} onReset={answer.reset} />
      <QueryStates
        query={query}
        isEmpty={applications.length === 0}
        empty={<EmptyApplications tab={tab} />}
        skeletonRows={2}
      />
      <RoleApplicationList
        applications={applications}
        busy={answer.isPending || !mayDecide}
        onAnswer={answer.submit}
      />
    </ModerationPage>
  )
}

function EmptyApplications({ tab }: { tab: RoleTab }) {
  return (
    <EmptyNotice title={EMPTY[tab]}>Форма заявки открыта в профиле любого вошедшего.</EmptyNotice>
  )
}

interface RoleApplicationListProps {
  applications: RoleApplicationView[]
  busy: boolean
  onAnswer: (id: string, decision: RoleRequestDecision) => void
}

function RoleApplicationList({ applications, busy, onAnswer }: RoleApplicationListProps) {
  return (
    <>
      {applications.map((application, index) => (
        <RoleApplicationCard
          key={application.id}
          application={application}
          first={index === 0}
          busy={busy}
          onAnswer={onAnswer}
        />
      ))}
    </>
  )
}

function useRoleAnswer() {
  const client = useQueryClient()
  const answer = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: RoleRequestDecision }) =>
      answerRoleRequest(id, decision),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['role-applications'] }),
  })
  const { mutate } = answer
  const submit = useCallback(
    (id: string, decision: RoleRequestDecision) => mutate({ id, decision }),
    [mutate],
  )
  return { ...answer, submit }
}
