// Очередь модерации. Слева поток, справа проверка выбранного — модератор смотрит подряд
// десятки карточек, и возврат к списку после каждой стоил бы половины рабочего времени.
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PillTabs } from '../../shared/ui/PillTabs'
import { EmptyNotice } from '../../shared/ui/ListStates'
import { MutationFailure, QueryStates } from '../../shared/ui/QueryStates'
import { fetchQueue, type QueueTab } from './api/moderationApi'
import { toQueueRow } from './logic/queueView'
import { ModerationPage } from './components/ModerationPage'
import { QueueReview } from './components/QueueReview'
import { useQueueDecision } from './useQueueDecision'

// Пустая вкладка объясняет себя: «ничего нет» на трёх вкладках значит три разные вещи,
// и одна формулировка на всех читалась бы как поломка выдачи.
const EMPTY: Record<QueueTab, { title: string; body: string }> = {
  pending: {
    title: 'Очередь пуста',
    body: 'Всё проверено. Новые объявления появятся здесь сразу после отправки.',
  },
  flagged: { title: 'Жалоб нет', body: 'На опубликованные карточки никто не жалуется.' },
  done: {
    title: 'Сегодня вы ничего не разбирали',
    body: 'Здесь ваши сегодняшние решения — не всей команды, а ваши.',
  },
}

export function ModerationQueuePage() {
  const [tab, setTab] = useState<QueueTab>('pending')
  const [selected, setSelected] = useState<string | null>(null)
  const query = useQuery({
    queryKey: ['moderation-queue', tab],
    queryFn: ({ signal }) => fetchQueue(tab, signal),
  })
  const decide = useQueueDecision(() => setSelected(null))
  const items = query.data?.items ?? []
  const rows = items.map(toQueueRow)
  const current = items.find((item) => item.id === (selected ?? items[0]?.id)) ?? null

  const empty = <EmptyNotice title={EMPTY[tab].title}>{EMPTY[tab].body}</EmptyNotice>

  return (
    <ModerationPage testId="moderation-queue" title="Очередь модерации" sub={SUB}>
      <QueueTabs tab={tab} counts={query.data} onSelect={setTab} />
      <MutationFailure error={decide.error} onReset={decide.reset} />
      <QueryStates query={query} isEmpty={rows.length === 0} empty={empty} />
      {rows.length > 0 ? (
        <QueueReview
          rows={rows}
          current={current}
          readOnly={tab === 'done'}
          decide={decide}
          onSelect={setSelected}
        />
      ) : null}
    </ModerationPage>
  )
}

const SUB = 'Объявление ждёт человека: автоматической публикации нет.'

interface QueueTabsProps {
  tab: QueueTab
  counts?: { pending: number; flagged: number; done_today: number }
  onSelect: (tab: QueueTab) => void
}

function QueueTabs({ tab, counts, onSelect }: QueueTabsProps) {
  return (
    <PillTabs
      current={tab}
      onSelect={onSelect}
      tabs={[
        { id: 'pending', label: 'Ожидают', count: counts?.pending },
        { id: 'flagged', label: 'Жалобы', count: counts?.flagged },
        { id: 'done', label: 'Проверенные сегодня', count: counts?.done_today },
      ]}
    />
  )
}
