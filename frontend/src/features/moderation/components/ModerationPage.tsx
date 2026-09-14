import type { ReactNode } from 'react'
import { Container } from '../../../shared/ui/Container'
import { SiteHeader } from '../../../shared/ui/SiteHeader'
import { PageHeading, PageSection } from '../../../shared/ui/PageHeading'
import { ModerationNav } from './ModerationNav'

interface ModerationPageProps {
  testId: string
  title?: string
  sub?: string
  children: ReactNode
}

export function ModerationPage({ testId, title, sub, children }: ModerationPageProps) {
  return (
    <>
      <SiteHeader signedIn />
      <main data-testid={testId}>
        <Container>
          <ModerationNav />
          <PageSection>
            {title ? <PageHeading title={title} sub={sub} /> : null}
            {children}
          </PageSection>
        </Container>
      </main>
    </>
  )
}
