// Жалобы. Снятие с публикации — решение модератора: автоматики нет, сколько бы жалоб ни
// пришло, иначе конкуренты снимали бы чужие объявления числом.
import { useQuery } from '@tanstack/react-query'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageHeading, PageSection } from '../../shared/ui/PageHeading'
import { Panel } from '../../shared/ui/Panel'
import { Avatar } from '../../shared/ui/Avatar'
import { Button, ButtonLink } from '../../shared/ui/Button'
import { Placeholder } from '../../shared/ui/Placeholder'
import { EmptyNotice, FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { ROUTES } from '../../shared/navigation/routes'
import { fetchComplaints } from './api/moderationApi'
import { toComplaintCase } from './logic/complaintView'
import styles from './complaints.module.css'

export function ComplaintsPage() {
  const now = new Date()
  const query = useQuery({
    queryKey: ['complaints'],
    queryFn: ({ signal }) => fetchComplaints(signal),
  })
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
                  <Button tone="ghost">Написать продавцу</Button>
                  <Button tone="ghost">Снять с публикации</Button>
                  <Button tone="ghost">Отклонить жалобы</Button>
                </div>
              </Panel>
            ))}
          </PageSection>
        </Container>
      </main>
    </>
  )
}
