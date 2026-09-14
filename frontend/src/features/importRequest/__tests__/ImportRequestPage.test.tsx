import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { ImportRequestPage } from '../ImportRequestPage'
import { BACKEND } from '../../../shared/api/backend/paths'
import { renderPage } from '../../../test/renderPage'
import { fakeServer, resetServer, signedIn, type FakeServer } from '../../../test/fakeServer'

// Копия `BuyerRequest` и `SupplierResponse` (api-specs истории 18).
const request = (over: Record<string, unknown> = {}) => ({
  request_id: 'r1',
  user_id: 'buyer',
  brand: 'Toyota',
  model: 'Land Cruiser 300',
  year_from: 2022,
  budget_max: 12000000,
  comment: 'Белый, без люка',
  status: 'open',
  responses_count: 2,
  created_at: '2026-09-10T10:00:00',
  ...over,
})
const response = (id: string, supplier: string, price: number, days: number) => ({
  response_id: id,
  request_id: 'r1',
  supplier_id: supplier,
  price,
  delivery_days: days,
  comment: null,
  created_at: '2026-09-11T10:00:00',
})

let server: FakeServer

function open() {
  renderPage(<ImportRequestPage signedIn />, { at: '/r/r1', route: '/r/:requestId' })
}

beforeEach(() => {
  server = fakeServer()
  server.on('GET', BACKEND.request.mine, { status: 200, body: [] })
})
afterEach(resetServer)

// Feature: Заявка на привоз — автор и поставщики
describe('страница заявки на привоз', () => {
  it('Scenario: автор видит условия заявки и отклики, самый дешёвый помечен', async () => {
    // Given покупатель открыл заявку на Land Cruiser 300, откликнулись двое
    signedIn('buyer')
    server.on('GET', BACKEND.request.mine, { status: 200, body: [request()] })
    server.on('GET', BACKEND.request.responses('r1'), {
      status: 200,
      body: [response('a', 's1', 11900000, 45), response('b', 's2', 11500000, 60)],
    })
    // When он открывает заявку
    open()
    // Then условия заявки видны, откликов два, дешевле остальных — один
    expect(
      await screen.findByRole('heading', { name: 'Toyota Land Cruiser 300' }),
    ).toBeInTheDocument()
    expect(screen.getByText('от 2022')).toBeInTheDocument()
    expect(await screen.findAllByTestId('bid')).toHaveLength(2)
    expect(screen.getAllByText('дешевле остальных')).toHaveLength(1)
    expect(screen.getByText('под ключ · 60 дней')).toBeInTheDocument()
  })

  it('Scenario: автор закрывает заявку', async () => {
    signedIn('buyer')
    server.on('GET', BACKEND.request.mine, { status: 200, body: [request()] })
    server.on('GET', BACKEND.request.responses('r1'), { status: 200, body: [] })
    server.on('POST', BACKEND.request.close('r1'), {
      status: 200,
      body: request({ status: 'closed' }),
    })
    open()

    fireEvent.click(await screen.findByTestId('close-request'))

    await waitFor(() => expect(server.callsTo('POST', BACKEND.request.close('r1'))).toHaveLength(1))
  })

  it('Scenario: поставщик откликается ценой с пробелами и попадает в переписку', async () => {
    // Given поставщик нашёл заявку в ленте спроса
    signedIn('s1', 'importer')
    server.on('GET', BACKEND.request.collection, {
      status: 200,
      body: { items: [request()], total: 1, page: 1, size: 20 },
    })
    server.on('GET', BACKEND.request.responses('r1'), { status: 200, body: [] })
    server.on('PUT', BACKEND.request.response('r1'), {
      status: 200,
      body: { ...response('a', 's1', 6690000, 40), dialog_id: 'd1' },
    })
    open()
    // When вписывает цену «6 690 000» и срок 40 дней
    fireEvent.change(await screen.findByTestId('bid-price'), { target: { value: '6 690 000' } })
    fireEvent.change(screen.getByTestId('bid-days'), { target: { value: '40' } })
    fireEvent.click(screen.getByTestId('bid-send'))
    // Then покупателю уходит число и срок, а поставщика уводят в переписку
    await waitFor(() =>
      expect(server.callsTo('PUT', BACKEND.request.response('r1'))[0]?.body).toEqual({
        price: 6690000,
        delivery_days: 40,
      }),
    )
    await waitFor(() => expect(screen.queryByTestId('import-request')).toBeNull())
  })

  it('Scenario: повторный отклик правит свой — форма заполнена прежним', async () => {
    signedIn('s1', 'importer')
    server.on('GET', BACKEND.request.collection, {
      status: 200,
      body: { items: [request()], total: 1, page: 1, size: 20 },
    })
    server.on('GET', BACKEND.request.responses('r1'), {
      status: 200,
      body: [response('a', 's1', 6690000, 40)],
    })
    open()

    expect(await screen.findByRole('button', { name: 'Изменить отклик' })).toBeInTheDocument()
    expect((screen.getByTestId('bid-price') as HTMLInputElement).value).toBe('6690000')
  })

  it('Scenario: на закрытую заявку откликнуться нельзя', async () => {
    signedIn('s1', 'importer')
    server.on('GET', BACKEND.request.collection, {
      status: 200,
      body: { items: [request({ status: 'closed' })], total: 1, page: 1, size: 20 },
    })
    server.on('GET', BACKEND.request.responses('r1'), { status: 200, body: [] })
    open()

    expect(await screen.findByText('закрыта')).toBeInTheDocument()
    expect(screen.queryByTestId('respond-form')).toBeNull()
  })

  it('Scenario: чужая заявка покупателю не видна', async () => {
    signedIn('other')
    open()

    expect(await screen.findByText('Заявка не найдена — возможно, её закрыли.')).toBeInTheDocument()
    expect(
      server.calls.some((call) => call.path.startsWith(`${BACKEND.request.collection}?`)),
    ).toBe(false)
  })
})
