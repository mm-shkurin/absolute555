// Заявка на привоз глазами её автора и глазами поставщика. Разница — в блоке действий:
// автор закрывает заявку, поставщик откликается.
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageSection } from '../../shared/ui/PageHeading'
import { Panel, PanelNote } from '../../shared/ui/Panel'
import { Button } from '../../shared/ui/Button'
import { StatusBadge } from '../../shared/ui/StatusBadge'
import { FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { ROUTES } from '../../shared/navigation/routes'
import { currentRole, currentSession } from '../../shared/session/authSession'
import { closeRequest, putResponse } from './api/requestApi'
import { bidsTitle, toBidViews, toRequestView } from './logic/requestView'
import { requestFailureText } from './logic/requestFailure'
import { BidList } from './components/BidList'
import { RespondForm } from './components/RespondForm'
import { useRequest } from './useRequest'
import styles from './request.module.css'
import page from '../../shared/ui/PageHeading.module.css'

export function ImportRequestPage({ signedIn = false }: { signedIn?: boolean }) {
  const { requestId = '' } = useParams()
  const client = useQueryClient()
  const { request, responses } = useRequest(requestId)
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['import-request', requestId] })
    void client.invalidateQueries({ queryKey: ['import-request-responses', requestId] })
  }

  const respond = useMutation({
    mutationFn: (body: { price: number; delivery_days: number; comment?: string }) =>
      putResponse(requestId, body),
    onSuccess: refresh,
  })
  const close = useMutation({ mutationFn: () => closeRequest(requestId), onSuccess: refresh })

  const view = request.data ? toRequestView(request.data) : null
  const bids = toBidViews(responses.data ?? [])
  const mine = request.data?.user_id === currentSession()?.userId
  const myResponse = responses.data?.find((one) => one.supplier_id === currentSession()?.userId)

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
                    {mine ? (
                      <Button
                        tone="ghost"
                        disabled={!view.active || close.isPending}
                        onClick={() => close.mutate()}
                        data-testid="close-request"
                      >
                        Закрыть заявку
                      </Button>
                    ) : null}
                  </div>
                </Panel>

                {/* Откликается только поставщик, и только на открытую заявку: закрытая
                    откликов не принимает, и сервер отвечает на неё 409. */}
                {!mine && currentRole() === 'importer' && view.active ? (
                  <Panel title="Ваш отклик" testId="request-respond">
                    <RespondForm
                      existing={myResponse ?? null}
                      busy={respond.isPending}
                      error={respond.error ? requestFailureText(respond.error) : null}
                      onSend={(price, days, comment) =>
                        respond.mutate({
                          price,
                          delivery_days: days,
                          comment: comment || undefined,
                        })
                      }
                    />
                  </Panel>
                ) : null}

                <Panel title={bidsTitle(bids.length)} testId="request-bids">
                  <BidList bids={bids} />
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
