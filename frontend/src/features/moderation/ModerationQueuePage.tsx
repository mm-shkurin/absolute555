// Очередь модерации. Слева поток, справа проверка выбранного — модератор смотрит подряд
// десятки карточек, и возврат к списку после каждой стоил бы половины рабочего времени.
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageHeading, PageSection } from '../../shared/ui/PageHeading'
import { PillTabs } from '../../shared/ui/PillTabs'
import { EmptyNotice, FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { approveListing, fetchQueue, rejectListing, type QueueTab } from './api/moderationApi'
import type { RejectionLabel } from '../../shared/api/backend/moderationContract'
import { toQueueRow, toReviewCard } from './logic/queueView'
import { QueueList } from './components/QueueList'
import { ReviewPanel } from './components/ReviewPanel'
import styles from './moderation.module.css'

type Decision =
  | { kind: 'publish'; id: string }
  | { kind: 'reject'; id: string; label: RejectionLabel; comment: string }

// Пустая вкладка объясняет себя: «ничего нет» на трёх вкладках значит три разные вещи,
// и одна формулировка на всех читалась бы как поломка выдачи.
const EMPTY: Record<QueueTab, { title: string; body: string }> = {
  pending: {
    title: 'Очередь пуста',
    body: 'Всё проверено. Новые объявления появятся здесь сразу после отправки.',
  },
  flagged: { title: 'Жалоб нет', body: 'На опубликованные карточки никто не жалуется.' },
  done: {
    title: 'Сегодня ничего не разбирали',
    body: 'Здесь появятся объявления, решение по которым принято сегодня.',
  },
}

export function ModerationQueuePage() {
  const [tab, setTab] = useState<QueueTab>('pending')
  const [selected, setSelected] = useState<string | null>(null)
  const client = useQueryClient()
  const query = useQuery({
    queryKey: ['moderation-queue', tab],
    queryFn: ({ signal }) => fetchQueue(tab, signal),
  })

  const decide = useMutation({
    mutationFn: (decision: Decision) =>
      decision.kind === 'publish'
        ? approveListing(decision.id)
        : rejectListing(decision.id, decision.label, decision.comment),
    onSuccess: () => {
      // Разобранная карточка уходит из очереди, и выбор вместе с ней: оставленный выбор
      // указывал бы на строку, которой в списке уже нет.
      setSelected(null)
      void client.invalidateQueries({ queryKey: ['moderation-queue'] })
      void client.invalidateQueries({ queryKey: ['complaints'] })
    },
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
            {decide.error ? (
              <FailureNotice
                message={(decide.error as Error).message}
                onRetry={() => decide.reset()}
              />
            ) : null}
            {!query.isPending && query.error ? (
              <FailureNotice
                message={(query.error as Error).message}
                onRetry={() => void query.refetch()}
              />
            ) : null}
            {!query.isPending && !query.error && rows.length === 0 ? (
              <EmptyNotice title={EMPTY[tab].title}>{EMPTY[tab].body}</EmptyNotice>
            ) : null}
            {rows.length > 0 ? (
              <div className={styles.layout}>
                <QueueList rows={rows} current={current?.id ?? null} onSelect={setSelected} />
                {current ? (
                  <ReviewPanel
                    card={toReviewCard(current)}
                    listingId={current.listing_id}
                    busy={decide.isPending}
                    readOnly={tab === 'done'}
                    onPublish={() => decide.mutate({ kind: 'publish', id: current.listing_id })}
                    onReject={(label, comment) =>
                      decide.mutate({ kind: 'reject', id: current.listing_id, label, comment })
                    }
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
