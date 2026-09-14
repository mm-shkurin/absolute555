import type { ReactNode } from 'react'
import { Container } from './Container'
import { SiteHeader } from './SiteHeader'

interface Props {
  signedIn: boolean
  onSignIn?: () => void
  testId: string
  crumbs: ReactNode
  crumbsClassName: string
  children: ReactNode
  outside?: ReactNode
}

export function PageShell({
  signedIn,
  onSignIn,
  testId,
  crumbs,
  crumbsClassName,
  children,
  outside,
}: Props) {
  return (
    <>
      <SiteHeader signedIn={signedIn} onSignIn={onSignIn} />
      <main data-testid={testId}>
        <Container>
          <div className={crumbsClassName}>{crumbs}</div>
          {children}
        </Container>
      </main>
      {outside}
    </>
  )
}
