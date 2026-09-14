import type { ReactNode } from 'react'
import { Container } from './Container'
import { NarrowPage } from './FormCard'
import { SiteHeader } from './SiteHeader'

interface Props {
  signedIn: boolean
  onSignIn?: () => void
  testId: string
  crumbs: ReactNode
  crumbsClassName: string
  children: ReactNode
  outside?: ReactNode
  narrow?: boolean
}

export function PageShell({
  signedIn,
  onSignIn,
  testId,
  crumbs,
  crumbsClassName,
  children,
  outside,
  narrow = false,
}: Props) {
  const body = (
    <>
      <div className={crumbsClassName}>{crumbs}</div>
      {children}
    </>
  )
  return (
    <>
      <SiteHeader signedIn={signedIn} onSignIn={onSignIn} />
      <main data-testid={testId}>
        <Container>{narrow ? <NarrowPage>{body}</NarrowPage> : body}</Container>
      </main>
      {outside}
    </>
  )
}
