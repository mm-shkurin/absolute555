// Очередь профилей поставщиков. Витрина проходит ту же проверку, что и объявление:
// опубликованная без неё, она ничем не отличается от объявления, обходящего очередь.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { EmptyNotice } from '../../shared/ui/ListStates'
import { MutationFailure, QueryStates } from '../../shared/ui/QueryStates'
import {
  approveSupplier,
  fetchSupplierQueue,
  rejectSupplier,
} from '../../shared/api/backend/supplierApi'
import type { SupplierProfileWire } from '../../shared/api/backend/supplierContract'
import { ModerationPage } from './components/ModerationPage'
import { SupplierProfileCard } from './components/SupplierProfileCard'

type Decision =
  { kind: 'approve'; userId: string } | { kind: 'reject'; userId: string; reason: string }

const SUB =
  'Витрину отправляет тот, кому роль уже выдана. Сама заявка на роль решается в соседнем разделе.'

// Правку опубликованной витрины модератор читает поверх прежних полей: решает он о том,
// что увидят покупатели, а не о том, что лежало раньше.
function withPendingOnTop(one: SupplierProfileWire): SupplierProfileWire {
  return { ...one, ...one.pending_changes, cover_url: one.pending_cover_url ?? one.cover_url }
}

export function SupplierQueuePage() {
  const query = useQuery({
    queryKey: ['supplier-queue'],
    queryFn: ({ signal }) => fetchSupplierQueue(signal),
  })
  const decide = useSupplierDecision()
  const items = query.data?.items ?? []

  return (
    <ModerationPage testId="supplier-queue" title="Витрины поставщиков" sub={SUB}>
      <QueryStates query={query} isEmpty={items.length === 0} empty={<EmptyQueue />} />
      <MutationFailure error={decide.error} onReset={decide.reset} />
      {items.map(withPendingOnTop).map((profile) => (
        <SupplierProfileCard
          key={profile.user_id}
          profile={profile}
          busy={decide.isPending}
          onApprove={() => decide.mutate({ kind: 'approve', userId: profile.user_id })}
          onReject={(reason) => decide.mutate({ kind: 'reject', userId: profile.user_id, reason })}
        />
      ))}
    </ModerationPage>
  )
}

function useSupplierDecision() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (decision: Decision) =>
      decision.kind === 'approve'
        ? approveSupplier(decision.userId)
        : rejectSupplier(decision.userId, decision.reason),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['supplier-queue'] }),
  })
}

function EmptyQueue() {
  return (
    <EmptyNotice title="Очередь пуста">
      Здесь витрины уже одобренных поставщиков, отправленные на проверку. Тот, кто только просится в
      поставщики, ждёт в разделе «Заявки в поставщики» — это разные шаги, и решение по одному не
      меняет другой.
    </EmptyNotice>
  )
}
