import type { ReactNode } from 'react'
import { PageSection } from './PageHeading'
import { PageShell } from './PageShell'

interface Props {
  signedIn: boolean
  testId: string
  crumbs: ReactNode
  crumbsClassName: string
  children: ReactNode
}

export function NarrowFormPage({ children, ...shell }: Props) {
  return (
    <PageShell narrow {...shell}>
      <PageSection>{children}</PageSection>
    </PageShell>
  )
}
