import { useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { swipeStep } from './logic/gallerySwipe'

export function usePointerSwipe(onStep: (by: number) => void) {
  // Точка нажатия: от неё считается жест. В ref, а не в состоянии — перерисовывать
  // галерею на каждое движение пальца незачем.
  const from = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)

  const handlers = {
    onPointerDown: (event: ReactPointerEvent) => {
      from.current = { x: event.clientX, y: event.clientY }
      swiped.current = false
    },
    onPointerUp: (event: ReactPointerEvent) => {
      const start = from.current
      from.current = null
      if (!start) return
      const by = swipeStep(event.clientX - start.x, event.clientY - start.y)
      if (by === 0) return
      // Жест засчитан — значит это листание, а не нажатие: полноэкранный просмотр по
      // окончании свайпа открываться не должен.
      swiped.current = true
      onStep(by)
    },
    onPointerCancel: () => {
      from.current = null
    },
  }
  return { handlers, swiped }
}
