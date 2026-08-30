// Заявка на привоз глазами её автора и глазами поставщика. Разница — в блоке действий:
// автор правит и закрывает заявку, поставщик откликается.
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageSection } from '../../shared/ui/PageHeading'
import { Panel, PanelNote } from '../../shared/ui/Panel'
import { Button } from '../../shared/ui/Button'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { ROUTES } from '../../shared/navigation/routes'
import { fetchBids, fetchRequest } from './api/requestApi'
import { bidsTitle, toBidViews, toRequestView } from './logic/requestView'
import { BidList } from './components/BidList'
import styles from './request.module.css'
import page from '../../shared/ui/PageHeading.module.css'

export function ImportRequestPage({ signedIn = false }: { signedIn?: boolean }) {
  const { requestId = '' } = useParams()
  const navigate = useNavigate()
  const request = useQuery({
    queryKey: ['import-request', requestId],
    queryFn: ({ signal }) => fetchRequest(requestId, signal),
  })
  const bids = useQuery({
    queryKey: ['import-request-bids', requestId],
    queryFn: ({ signal }) => fetchBids(requestId, signal),
  })

  const view = request.data ? toRequestView(request.data) : null
  const bidViews = toBidViews(bids.data?.items ?? [])

  return (
    <>
      <SiteHeader signedIn={signedIn} />
      <main data-testid="import-request">
        <Container>
          <div className={styles.crumbs}>
            <Link to={ROUTES.importFeed}>Под заказ</Link> › Заявка
          </div>
          <PageSection>
            {request.isPending ? <ListSkeleton rows={3} /> : null}
            {!request.isPending && request.error ? (
              <FailureNotice
                message={(request.error as Error).message}
                onRetry={() => void request.refetch()}
              />
            ) : null}
            {view ? (
              <>
                <h1 className={page.title}>{view.title}</h1>
                <p className={styles.subtitle}>
                  {view.subtitle}
                  <StatusBadge tone={view.active ? 'info' : 'past'}>
                    {view.active ? 'активна' : 'закрыта'}
                  </StatusBadge>
                </p>

                <Panel first testId="request-specs">
                  <div className={styles.specs}>
                    {view.specs.map((row) => (
                      <div key={row.label}>
                        <span>{row.label}</span>
                        <b>{row.value}</b>
                      </div>
                    ))}
                  </div>
                  {view.comment ? <p className={styles.comment}>{view.comment}</p> : null}
                  <div className={styles.ownerActions}>
                    {view.ownedByMe ? (
                      <>
                        <Button tone="ghost">Редактировать</Button>
                        <Button tone="ghost">Закрыть заявку</Button>
                      </>
                    ) : (
                      <Button disabled={!view.active}>Откликнуться на заявку</Button>
                    )}
                  </div>
                </Panel>

                <Panel title={bidsTitle(bidViews.length)} testId="request-bids">
                  <BidList bids={bidViews} onWrite={() => navigate(ROUTES.chats)} />
                  <PanelNote>
                    Отклик — это предложение наоборот: не вы торгуетесь за машину, а поставщики за
                    вас. Площадка в расчётах не участвует.
                  </PanelNote>
                </Panel>
              </>
            ) : null}
          </PageSection>
        </Container>
      </main>
    </>
  )
}
