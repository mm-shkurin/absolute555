import type { ReactNode } from 'react'
import { Button } from '../../../shared/ui/Button'
import { NavSpacer } from '../../../shared/ui/FormCard'

export interface WizardNavProps {
  backLabel?: string
  onBack: () => void
  children: ReactNode
}

export function WizardNav({ backLabel = 'Назад', onBack, children }: WizardNavProps) {
  return (
    <>
      <Button tone="ghost" onClick={onBack}>
        {backLabel}
      </Button>
      <NavSpacer />
      {children}
    </>
  )
}
