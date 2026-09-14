import { useEffect } from 'react'
import { browserDocument, browserWindow } from '../lib/browser'

export function useSheetDismissal(onClose: () => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const win = browserWindow()
    const body = browserDocument()?.body
    win?.addEventListener('keydown', onKey)
    // Фон под шторкой не прокручивается: иначе палец, промахнувшийся мимо списка,
    // уводит ленту, и человек теряет место, к которому вернётся после фильтра.
    const previous = body?.style.overflow ?? ''
    if (body) body.style.overflow = 'hidden'
    return () => {
      win?.removeEventListener('keydown', onKey)
      if (body) body.style.overflow = previous
    }
  }, [onClose])
}
