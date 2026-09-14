// Жалобы. Снятие с публикации — решение модератора: автоматики нет, сколько бы жалоб ни
// пришло, иначе конкуренты снимали бы чужие объявления числом.
import { useQuery } from '@tanstack/react-query'
import { EmptyNotice } from '../../shared/ui/ListStates'
import { MutationFailure, QueryStates } from '../../shared/ui/QueryStates'
import { fetchComplaints } from './api/moderationApi'
import { toComplaintCase } from './logic/complaintView'
import { ComplaintCase } from './components/ComplaintCase'
import { ModerationPage } from './components/ModerationPage'
import { useComplaintActions } from './useComplaintActions'

const SUB =
  'Жалобы копятся на объявление. Снятие с публикации — решение модератора, автоматики нет.'

export function ComplaintsPage() {
  const now = new Date()
  const actions = useComplaintActions()
  const query = useQuery({
    queryKey: ['complaints'],
    queryFn: ({ signal }) => fetchComplaints(signal),
  })
  const cases = (query.data?.items ?? []).map((item) => toComplaintCase(item, now))

  return (
    <ModerationPage testId="complaints" title="Жалобы" sub={SUB}>
      <MutationFailure error={actions.failure} onReset={actions.reset} />
      <QueryStates query={query} isEmpty={cases.length === 0} empty={<EmptyComplaints />} />
      {cases.map((item, index) => (
        <ComplaintCase
          key={item.listingId}
          item={item}
          first={index === 0}
          busy={actions.busy}
          unpublishing={actions.unpublishing === item.listingId}
          onToggle={actions.toggle}
          onUnpublish={actions.unpublish}
          onDismiss={actions.dismiss}
        />
      ))}
    </ModerationPage>
  )
}

function EmptyComplaints() {
  return (
    <EmptyNotice title="Открытых жалоб нет">
      Всё разобрано — на опубликованные карточки никто не жалуется.
    </EmptyNotice>
  )
}
