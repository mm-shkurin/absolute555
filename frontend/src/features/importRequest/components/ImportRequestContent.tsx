import { FailureNotice, ListSkeleton } from '../../../shared/ui/ListStates'
import { currentSession } from '../../../shared/session/authSession'
import { toBidViews, toRequestView } from '../logic/requestView'
import { useRequest } from '../useRequest'
import { useRequestActions } from '../useRequestActions'
import { RequestDetails } from './RequestDetails'

interface ImportRequestContentProps {
  requestId: string
}

export function ImportRequestContent({ requestId }: ImportRequestContentProps) {
  const { request, responses } = useRequest(requestId)
  const actions = useRequestActions(requestId)
  const view = request.data ? toRequestView(request.data) : null
  const viewerId = currentSession()?.userId
  return (
    <>
      {request.isPending ? <ListSkeleton rows={3} /> : null}
      {!request.isPending && request.error ? (
        <FailureNotice message={request.error.message} onRetry={() => void request.refetch()} />
      ) : null}
      {view ? (
        <RequestDetails
          view={view}
          bids={toBidViews(responses.data ?? [])}
          mine={request.data?.user_id === viewerId}
          myResponse={responses.data?.find((one) => one.supplier_id === viewerId)}
          actions={actions}
        />
      ) : null}
    </>
  )
}
