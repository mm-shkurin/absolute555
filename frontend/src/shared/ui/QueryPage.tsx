import type { ReactNode } from 'react'
import { PageSection } from './PageHeading'
import { PageShell } from './PageShell'
import { QueryStates, type QueryLike } from './QueryStates'

interface Props {
  signedIn: boolean
  testId: string
  crumbs: ReactNode
  crumbsClassName: string
  query: QueryLike
  children: ReactNode
}

export function QueryPage({ query, children, ...shell }: Props) {
  return (
    <PageShell {...shell}>
      <PageSection>
        <QueryStates query={query} isEmpty={false} skeletonRows={3} />
        {children}
      </PageSection>
    </PageShell>
  )
}
