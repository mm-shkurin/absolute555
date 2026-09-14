import type { ReactNode } from 'react'
import { FailureNotice, ListSkeleton } from './ListStates'

export interface QueryLike {
  isPending: boolean
  error: Error | null
  refetch: () => unknown
}

interface QueryStatesProps {
  query: QueryLike
  isEmpty: boolean
  empty?: ReactNode
  skeletonRows?: number
  failureMessage?: string
}

export function QueryStates({
  query,
  isEmpty,
  empty,
  skeletonRows,
  failureMessage,
}: QueryStatesProps) {
  if (query.isPending) return <ListSkeleton rows={skeletonRows} />
  if (query.error) {
    return (
      <FailureNotice
        message={failureMessage ?? query.error.message}
        onRetry={() => void query.refetch()}
      />
    )
  }
  return isEmpty ? <>{empty}</> : null
}

interface MutationFailureProps {
  error: Error | null
  onReset: () => void
}

export function MutationFailure({ error, onReset }: MutationFailureProps) {
  if (!error) return null
  return <FailureNotice message={error.message} onRetry={onReset} />
}
