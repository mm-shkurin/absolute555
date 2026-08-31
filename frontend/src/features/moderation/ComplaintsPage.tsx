// Жалобы. Снятие с публикации — решение модератора: автоматики нет, сколько бы жалоб ни
// пришло, иначе конкуренты снимали бы чужие объявления числом.
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageHeading, PageSection } from '../../shared/ui/PageHeading'
import { Panel } from '../../shared/ui/Panel'
import { Avatar } from '../../shared/ui/Avatar'
import { Button, ButtonLink } from '../../shared/ui/Button'
import { Placeholder } from '../../shared/ui/Placeholder'
import { EmptyNotice, FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { ROUTES } from '../../shared/navigation/routes'
import { dismissComplaint, fetchComplaints, unpublishListing } from './api/moderationApi'
import { ReasonPicker } from '../../shared/ui/ReasonPicker'
import { REJECTION_REASONS } from '../../shared/domain/moderationReasons'
import type { RejectionLabel } from '../../shared/api/backend/moderationContract'
import { toComplaintCase } from './logic/complaintView'
import styles from './complaints.module.css'

export function ComplaintsPage() {
  const now = new Date()
  const client = useQueryClient()
  // Снятие с публикации требует причину: карточку уже видели люди, и продавец должен
  // узнать не только что её сняли, но и за что.
  const [unpublishing, setUnpublishing] = useState<string | null>(null)
  const query = useQuery({
    queryKey: ['complaints'],
    queryFn: ({ signal }) => fetchComplaints(signal),
  })

  const refresh = () => {
    setUnpublishing(null)
    void client.invalidateQueries({ queryKey: ['complaints'] })
    void client.invalidateQueries({ queryKey: ['moderation-queue'] })
  }

  const unpublish = useMutation({
    mutationFn: ({ id, label }: { id: string; label: RejectionLabel }) => unpublishListing(id, label),
    onSuccess: refresh,
  })

  // Жалобы копятся на объявление, а решение принимается по их совокупности: отклоняются
  // все открытые жалобы карточки, а не выбранная строка.
  const dismissAll = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => dismissComplaint(id))),
    onSuccess: refresh,
  })

  const busy = unpublish.isPending || dismissAll.isPending
  const failure = (unpublish.error ?? dismissAll.error) as Error | null
  const cases = (query.data?.items ?? []).map((item) => toComplaintCase(item, now))

  return (
    <>
      <SiteHeader signedIn />
      <main data-testid="complaints">
        <Container>
          <PageSection>
            <PageHeading
              title="Жалобы"
              sub="Жалобы копятся на объявление. Снятие с публикации — решение модератора, автоматики нет."
            />
            {failure ? (
              <FailureNotice
                message={failure.message}
                onRetry={() => {
                  unpublish.reset()
                  dismissAll.reset()
                }}
              />
            ) : null}
            {query.isPending ? <ListSkeleton /> : null}
            {!query.isPending && query.error ? (
              <FailureNotice
                message={(query.error as Error).message}
                onRetry={() => void query.refetch()}
              />
            ) : null}
            {!query.isPending && !query.error && cases.length === 0 ? (
              <EmptyNotice title="Открытых жалоб нет">
                Всё разобрано — на опубликованные карточки никто не жалуется.
              </EmptyNotice>
            ) : null}
            {cases.map((item, index) => (
              <Panel key={item.listingId} first={index === 0} testId="complaint-case">
                <div className={styles.head}>
                  <Placeholder className={styles.cover}>обложка</Placeholder>
                  <div className={styles.headBody}>
                    <div className={styles.title}>{item.title}</div>
                    <div className={styles.seller}>{item.seller}</div>
                  </div>
                  <span className={styles.flag}>{item.count}</span>
                </div>
                <div className={styles.complaints}>
                  {item.complaints.map((complaint) => (
                    <div key={complaint.id} className={styles.complaint}>
                      <Avatar size={36} />
                      <div>
                        <div className={styles.author}>
                          {complaint.author} <span>{complaint.meta}</span>
                        </div>
                        <p className={styles.body}>{complaint.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.actions}>
                  <ButtonLink to={ROUTES.listing(item.listingId)}>Открыть карточку</ButtonLink>
                  <Button
                    tone="ghost"
                    disabled={busy}
                    onClick={() =>
                      setUnpublishing((current) =>
                        current === item.listingId ? null : item.listingId,
                      )
                    }
                  >
                    Снять с публикации
                  </Button>
                  <Button
                    tone="ghost"
                    disabled={busy}
                    onClick={() => dismissAll.mutate(item.complaints.map((one) => one.id))}
                  >
                    Отклонить жалобы
                  </Button>
                </div>
                {unpublishing === item.listingId ? (
                  <div className={styles.reasons} data-testid="unpublish-reasons">
                    <div className={styles.reasonsLabel}>За что снимаем — увидит продавец</div>
                    <ReasonPicker
                      options={REJECTION_REASONS}
                      current={null}
                      disabled={busy}
                      onPick={(label) => unpublish.mutate({ id: item.listingId, label })}
                    />
                  </div>
                ) : null}
              </Panel>
            ))}
          </PageSection>
        </Container>
      </main>
    </>
  )
}
