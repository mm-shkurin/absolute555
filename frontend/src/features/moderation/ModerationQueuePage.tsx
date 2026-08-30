// Очередь модерации. Слева поток, справа проверка выбранного — модератор смотрит подряд
// десятки карточек, и возврат к списку после каждой стоил бы половины рабочего времени.
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageHeading, PageSection } from '../../shared/ui/PageHeading'
import { PillTabs } from '../../shared/ui/PillTabs'
import { EmptyNotice, FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { fetchQueue, type QueueTab } from './api/moderationApi'
import { toQueueRow, toReviewCard } from './logic/queueView'
import { QueueList } from './components/QueueList'
import { ReviewPanel } from './components/ReviewPanel'
import styles from './moderation.module.css'

export function ModerationQueuePage() {
  const [tab, setTab] = useState<QueueTab>('pending')
  const [selected, setSelected] = useState<string | null>(null)
  const query = useQuery({
    queryKey: ['moderation-queue', tab],
    queryFn: ({ signal }) => fetchQueue(tab, signal),
  })

  const items = query.data?.items ?? []
  const rows = items.map(toQueueRow)
  const current = items.find((item) => item.id === (selected ?? items[0]?.id)) ?? null

  return (
    <>
      <SiteHeader signedIn />
      <main data-testid="moderation-queue">
        <Container>
          <PageSection>
            <PageHeading
              title="Очередь модерации"
              sub="Объявление ждёт человека: автоматической публикации нет."
            />
            <PillTabs
              current={tab}
              onSelect={setTab}
              tabs={[
                { id: 'pending', label: 'Ожидают', count: query.data?.pending },
                { id: 'flagged', label: 'Жалобы', count: query.data?.flagged },
                { id: 'done', label: 'Проверенные сегодня', count: query.data?.done_today },
              ]}
            />
            {query.isPending ? <ListSkeleton /> : null}
            {!query.isPending && query.error ? (
              <FailureNotice
                message={(query.error as Error).message}
                onRetry={() => void query.refetch()}
              />
            ) : null}
            {!query.isPending && !query.error && rows.length === 0 ? (
              <EmptyNotice title="Очередь пуста">
                Всё проверено. Новые объявления появятся здесь сразу после отправки.
              </EmptyNotice>
            ) : null}
            {rows.length > 0 ? (
              <div className={styles.layout}>
                <QueueList rows={rows} current={current?.id ?? null} onSelect={setSelected} />
                {current ? (
                  <ReviewPanel
                    card={toReviewCard(current)}
                    listingId={current.listing_id}
                    onPublish={() => undefined}
                    onReject={() => undefined}
                  />
                ) : null}
              </div>
            ) : null}
          </PageSection>
        </Container>
      </main>
    </>
  )
}
