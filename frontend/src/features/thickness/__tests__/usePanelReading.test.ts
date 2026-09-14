import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { PanelCode } from '../../../shared/thicknessMap/logic/bodyPanels'
import type { PanelDetail } from '../../../shared/thicknessMap/logic/thicknessMap'
import { usePanelReading } from '../usePanelReading'

const panel = (code: PanelCode): PanelDetail => ({
  code,
  label: code,
  grade: 'none',
  color: '',
  value: '',
  measured: false,
  valueUm: null,
  photoUrl: null,
  ocrValueUm: null,
  corrected: false,
  note: '',
})

describe('usePanelReading', () => {
  it('ignores a gauge result that arrives after the panel changed', async () => {
    const pending: Array<(value: number | null) => void> = []
    const onRead = () => new Promise<number | null>((done) => pending.push(done))
    const apply = vi.fn()
    const { result, rerender } = renderHook(
      ({ detail }) => usePanelReading(detail, '', apply, onRead),
      { initialProps: { detail: panel('hood') } },
    )
    act(() => result.current.read(new File([], 'gauge.jpg')))
    expect(result.current.state).toBe('busy')
    rerender({ detail: panel('roof') })
    await act(async () => pending[0](120))
    expect(apply).not.toHaveBeenCalled()
    expect(result.current.state).toBe('idle')
  })

  it('applies a gauge result for the same panel', async () => {
    const apply = vi.fn()
    const { result } = renderHook(() =>
      usePanelReading(panel('hood'), '', apply, () => Promise.resolve(120)),
    )
    await act(async () => result.current.read(new File([], 'gauge.jpg')))
    expect(apply).toHaveBeenCalledWith('120')
    expect(result.current.state).toBe('read')
  })
})
