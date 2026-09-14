import { useEffect } from 'react'
import { browserWindow } from '../../../shared/lib/browser'

export function useLightboxKeys(onClose: () => void, step: (delta: number) => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') step(1)
      if (event.key === 'ArrowLeft') step(-1)
    }
    const win = browserWindow()
    win?.addEventListener('keydown', onKey)
    return () => win?.removeEventListener('keydown', onKey)
  })
}
