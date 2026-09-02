// Очередь профилей поставщиков. Витрина проходит ту же проверку, что и объявление:
// опубликованная без неё, она ничем не отличается от объявления, обходящего очередь.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageHeading, PageSection } from '../../shared/ui/PageHeading'
import { EmptyNotice, FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import {
  approveSupplier,
  fetchSupplierQueue,
  rejectSupplier,
} from '../../shared/api/backend/supplierApi'
import { SupplierProfileCard } from './components/SupplierProfileCard'

type Decision = { kind: 'approve'; userId: string } | { kind: 'reject'; userId: string; reason: string }

export function SupplierQueuePage() {
  const client = useQueryClient()
  const query = useQuery({
    queryKey: ['supplier-queue'],
    queryFn: ({ signal }) => fetchSupplierQueue(signal),
  })

  const decide = useMutation({
    mutationFn: (decision: Decision) =>
      decision.kind === 'approve'
        ? approveSupplier(decision.userId)
        : rejectSupplier(decision.userId, decision.reason),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['supplier-queue'] }),
  })

  const items = query.data?.items ?? []

  return (
    <>
      <SiteHeader signedIn />
      <main data-testid="supplier-queue">
        <Container>
          <PageSection>
            <PageHeading
              title="Профили поставщиков"
              sub="Опубликованный профиль виден покупателям и подписывает позиции под привоз."
            />
            {query.isPending ? <ListSkeleton /> : null}
            {query.error ? (
              <FailureNotice
                message={(query.error as Error).message}
                onRetry={() => void query.refetch()}
              />
            ) : null}
            {decide.error ? (
              <FailureNotice
                message={(decide.error as Error).message}
                onRetry={() => decide.reset()}
              />
            ) : null}
            {!query.isPending && !query.error && items.length === 0 ? (
              <EmptyNotice title="Очередь пуста">
                Профили появятся здесь, как только поставщики отправят их на проверку.
              </EmptyNotice>
            ) : null}
            {items.map((profile) => (
              <SupplierProfileCard
                key={profile.user_id}
                profile={profile}
                busy={decide.isPending}
                onApprove={() => decide.mutate({ kind: 'approve', userId: profile.user_id })}
                onReject={(reason) =>
                  decide.mutate({ kind: 'reject', userId: profile.user_id, reason })
                }
              />
            ))}
          </PageSection>
        </Container>
      </main>
    </>
  )
}
