import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useWizardServer } from '../useWizardServer'
import { EMPTY_DRAFT } from '../logic/draft'
import { BACKEND } from '../../../shared/api/backend/paths'
import { fakeServer, resetServer, signedIn, type FakeServer } from '../../../test/fakeServer'

vi.mock('../../../shared/api/backend/listingStream', () => ({ openListingStream: () => () => undefined }))

function wizard() {
  return {
    draft: { ...EMPTY_DRAFT, price: '1900000' },
    stage: 'await' as const,
    applyDraft: vi.fn(),
    goStage: vi.fn(),
    goStep: vi.fn(),
    submit: vi.fn(),
  }
}

const started = {
  sale_car_id: 'car1',
  brand: 'Lexus',
  model: 'GS',
  year: 2012,
  milleage: 96400,
  price: null,
  photos: [],
  autofill: null,
  thickness: null,
  listing_kind: 'stock',
}

let server: FakeServer

beforeEach(() => {
  server = fakeServer()
  signedIn()
  server.on('GET', BACKEND.saleCar.one('car1'), { status: 200, body: started })
  server.on('PATCH', BACKEND.saleCar.one('car1'), { status: 200, body: started })
})
afterEach(resetServer)

describe('мастер продажи и сервер', () => {
  it('Scenario: вернулся к черновику — мастер открывается на первом незаполненном шаге', async () => {
    // Given у черновика заполнены машина и пробег, но нет цены
    const handle = wizard()
    // When продавец открывает черновик по ссылке
    renderHook(() => useWizardServer(handle, 'car1'))
    // Then мастер подставляет введённое и открывает шаг цены
    await waitFor(() => expect(handle.goStep).toHaveBeenCalledWith('pricing'))
    expect(handle.applyDraft.mock.calls[0][0].brand.value).toBe('Lexus')
  })

  it('Scenario: сервер отказал в отправке — продавец видит причину и остаётся на шаге', async () => {
    server.on('POST', BACKEND.saleCar.submit('car1'), {
      status: 409,
      body: { code: 'PHOTO_LIMIT_EXCEEDED', message: 'limit' },
    })
    const handle = wizard()
    const { result } = renderHook(() => useWizardServer(handle, 'car1'))
    await waitFor(() => expect(result.current.saleCarId).toBe('car1'))

    await act(() => result.current.submitForReview())

    expect(result.current.submitError).not.toBeNull()
    expect(handle.submit).not.toHaveBeenCalled()
  })

  it('Scenario: отправка принята — мастер показывает «отправлено»', async () => {
    server.on('POST', BACKEND.saleCar.submit('car1'), { status: 200, body: { status: 'review' } })
    const handle = wizard()
    const { result } = renderHook(() => useWizardServer(handle, 'car1'))
    await waitFor(() => expect(result.current.saleCarId).toBe('car1'))

    await act(() => result.current.submitForReview())

    expect(handle.submit).toHaveBeenCalledTimes(1)
    expect(result.current.submitError).toBeNull()
  })

  it('Scenario: черновика на сервере нет — отправка говорит проверить связь', async () => {
    server.on('POST', BACKEND.saleCar.draft, { status: 503, body: {} })
    const handle = wizard()
    const { result } = renderHook(() => useWizardServer(handle))

    await act(() => result.current.submitForReview())

    expect(result.current.submitError).toBe(
      'Черновик не сохранён на сервере. Проверьте связь и попробуйте ещё раз.',
    )
  })

  it('Scenario: снимок не принят — мастер возвращается к выбору файла', async () => {
    server.on('POST', BACKEND.saleCar.sts('car1'), { status: 413, body: {} })
    const handle = wizard()
    const { result } = renderHook(() => useWizardServer(handle, 'car1'))

    act(() => result.current.pickDocument(new File(['x'], 'sts.jpg')))

    await waitFor(() => expect(handle.goStage).toHaveBeenLastCalledWith('await'))
    expect(handle.goStage).toHaveBeenCalledWith('recognizing')
  })
})
