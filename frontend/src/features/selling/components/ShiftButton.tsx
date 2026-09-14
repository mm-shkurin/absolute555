import type { ReactNode } from 'react'

export interface ShiftButtonProps {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}

export function ShiftButton({ label, disabled, onClick, children }: ShiftButtonProps) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label}>
      {children}
    </button>
  )
}
