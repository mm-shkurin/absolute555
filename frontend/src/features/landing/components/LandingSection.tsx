import type { ReactNode } from 'react'
import { Container } from '../../../shared/ui/Container'
import { SectionHead } from './SectionParts'
import styles from '../landing.module.css'

interface LandingSectionProps {
  testId: string
  tight?: boolean
  eyebrow: string
  title: string
  sub?: ReactNode
  children: ReactNode
}

export function LandingSection({
  testId,
  tight,
  eyebrow,
  title,
  sub,
  children,
}: LandingSectionProps) {
  const className = tight ? `${styles.section} ${styles.tight}` : styles.section
  return (
    <section className={className} data-testid={testId}>
      <Container>
        <SectionHead eyebrow={eyebrow} title={title} sub={sub} />
        {children}
      </Container>
    </section>
  )
}
