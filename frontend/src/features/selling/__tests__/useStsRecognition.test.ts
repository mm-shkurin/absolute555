import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useStsRecognition } from '../useStsRecognition'
import { BACKEND } from '../../../shared/api/backend/paths'
import { fakeServer, resetServer, signedIn, type FakeServer } from '../../../test/fakeServer'

const stream = vi.hoisted(() => ({ onEvent: null as null | ((event: { status: string }) => void), closed: 0 }))
vi.mock('../../../shared/api/backend/listingStream', () => ({
  openListingStream: (_id: string, handlers: { onEvent: (event: { status: string }) => void }) => {
    stream.onEvent = handlers.onEvent
    return () => {
      stream.closed += 1
    }
  },
}))

let server: FakeServer

beforeEach(() => {
  server = fakeServer()
  signedIn()
  stream.onEvent = null
  stream.closed = 0
})
afterEach(() => {
  vi.useRealTimers()
  resetServer()
})

describe('ожидание распознавания СТС', () => {
  it('Scenario: снимок прочитан — мастер узнаёт исход из потока', () => {
    // Given продавец отправил снимок СТС
    const { result } = renderHook(() => useStsRecognition('car1', true))
    // When сервер сообщает, что распознавание закончено
    act(() => stream.onEvent?.({ status: 'DecodeSuccess' }))
    // Then мастер знает, что снимок прочитан
    expect(result.current.outcome).toBe('done')
  })

  it('Scenario: поток не застали — исход берётся из объявления', async () => {
    vi.useFakeTimers()
    server.on('GET', BACKEND.saleCar.one('car1'), {
      status: 200,
      body: { sale_car_id: 'car1', autofill: { state: 'done' } },
    })
    const { result } = renderHook(() => useStsRecognition('car1', true))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000)
    })

    expect(result.current.outcome).toBe('done')
  })

  it('исход принимается один раз — поздний кадр его не перезаписывает', () => {
    const { result } = renderHook(() => useStsRecognition('car1', true))

    act(() => stream.onEvent?.({ status: 'DecodeSuccess' }))
    act(() => stream.onEvent?.({ status: 'OcrFailed' }))

    expect(result.current.outcome).toBe('done')
  })

  it('поток закрывается, когда мастер ушёл с шага распознавания', () => {
    const { rerender } = renderHook(({ watching }) => useStsRecognition('car1', watching), {
      initialProps: { watching: true },
    })

    rerender({ watching: false })

    expect(stream.closed).toBe(1)
  })

  it('без черновика поток не открывается', () => {
    renderHook(() => useStsRecognition(null, true))

    expect(stream.onEvent).toBeNull()
  })
})
