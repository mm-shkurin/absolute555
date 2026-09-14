import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { SellingWizardPage } from '../SellingWizardPage'
import { BACKEND } from '../../../shared/api/backend/paths'
import { renderPage } from '../../../test/renderPage'
import { fakeServer, resetServer, signedIn, type FakeServer } from '../../../test/fakeServer'

const photo = (photoId: string) => ({
  photo_id: photoId,
  url: `https://cdn/${photoId}.jpg`,
  preview_url: `https://cdn/${photoId}-s.jpg`,
  position: 0,
})

// Копия `GET /sale_car/{id}` черновика.
const draft = (over: Record<string, unknown> = {}) => ({
  sale_car_id: 'car1',
  user_id: 'seller',
  vin: null,
  brand: 'Lexus',
  model: 'GS',
  mark_raw: null,
  model_raw: null,
  year: 2012,
  transmission: 'АКПП',
  engine_power: 249,
  phone_number: null,
  price: null,
  milleage: 96400,
  description: null,
  status: 'draft',
  photos: [],
  autofill: null,
  thickness: null,
  listing_kind: 'stock',
  import_country: null,
  delivery_days: null,
  turnkey_price: null,
  ...over,
})

const gallery = (...photos: ReturnType<typeof photo>[]) => ({ sale_car_id: 'car1', photos, limit: 15 })

let server: FakeServer

function openDraft(over: Record<string, unknown> = {}) {
  server.on('GET', BACKEND.saleCar.one('car1'), { status: 200, body: draft(over) })
  server.on('PATCH', BACKEND.saleCar.one('car1'), { status: 200, body: draft(over) })
  renderPage(<SellingWizardPage />, { at: '/sell/car1', route: '/sell/:saleCarId' })
}

beforeEach(() => {
  server = fakeServer()
  signedIn('seller')
})
afterEach(resetServer)

// Feature: Мастер продажи
describe('страница мастера продажи', () => {
  it('Scenario: вернулся к черновику без цены — мастер открывает шаг цены', async () => {
    // Given у черновика Lexus GS заполнены характеристики и пробег, цены нет
    openDraft()
    // When продавец открывает черновик
    // Then мастер сразу на шаге цены
    expect(await screen.findByTestId('step-pricing')).toBeInTheDocument()
  })

  it('Scenario: цена с пробелами сохраняется числом при переходе дальше', async () => {
    openDraft()

    fireEvent.change(await screen.findByPlaceholderText('4 020 000'), { target: { value: '1 900 000' } })
    fireEvent.click(screen.getByTestId('pricing-next'))

    expect(await screen.findByTestId('step-photos')).toBeInTheDocument()
    await waitFor(() =>
      expect(server.callsTo('PATCH', BACKEND.saleCar.one('car1')).at(-1)?.body).toMatchObject({ price: 1900000 }),
    )
  })

  it('Scenario: продавец добавляет фото и делает второе обложкой', async () => {
    openDraft({ price: 1900000 })
    server.on('POST', BACKEND.saleCar.photos('car1'), { status: 200, body: gallery(photo('p1'), photo('p2')) })
    server.on('PUT', BACKEND.saleCar.photoOrder('car1'), { status: 200, body: gallery(photo('p2'), photo('p1')) })
    await screen.findByTestId('step-photos')

    fireEvent.change(screen.getByTestId('photos-file'), {
      target: { files: [new File(['a'], 'a.jpg'), new File(['b'], 'b.jpg')] },
    })
    expect(await screen.findByText(/Снято 2 из 15/)).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('photo-make-cover'))

    await waitFor(() =>
      expect(server.callsTo('PUT', BACKEND.saleCar.photoOrder('car1'))[0]?.body).toEqual({ photo_ids: ['p2', 'p1'] }),
    )
  })

  it('Scenario: удалённое фото пропадает из шага', async () => {
    openDraft({ price: 1900000 })
    server.on('POST', BACKEND.saleCar.photos('car1'), { status: 200, body: gallery(photo('p1')) })
    server.on('DELETE', BACKEND.saleCar.photo('car1', 'p1'), { status: 200, body: gallery() })
    await screen.findByTestId('step-photos')
    fireEvent.change(screen.getByTestId('photos-file'), { target: { files: [new File(['a'], 'a.jpg')] } })
    await screen.findByText(/Снято 1 из 15/)

    fireEvent.click(screen.getByRole('button', { name: 'Удалить фото 1' }))

    expect(await screen.findByText(/Снято 0 из 15/)).toBeInTheDocument()
  })

  it('Scenario: без телефона и фото сводка не пускает на модерацию и называет, чего нет', async () => {
    openDraft({ price: 1900000 })
    await screen.findByTestId('step-photos')

    fireEvent.click(screen.getByRole('button', { name: /Отправка/ }))

    expect(await screen.findByTestId('submit-listing')).toBeDisabled()
    expect(screen.getByText(/Не заполнено: телефон, хотя бы одна фотография/)).toBeInTheDocument()
  })

  it('Scenario: заполненный черновик уходит на модерацию', async () => {
    openDraft({ price: 1900000, phone_number: '+79130000000', photos: [photo('p1')] })
    server.on('POST', BACKEND.saleCar.submit('car1'), { status: 200, body: { status: 'review' } })
    await screen.findByTestId('step-thickness')

    fireEvent.click(screen.getByRole('button', { name: /Отправка/ }))
    await waitFor(() => expect(screen.getByTestId('submit-listing')).toBeEnabled())
    fireEvent.click(screen.getByTestId('submit-listing'))

    await waitFor(() => expect(server.callsTo('POST', BACKEND.saleCar.submit('car1'))).toHaveLength(1))
    await waitFor(() => expect(screen.queryByTestId('step-review')).toBeNull())
  })

  it('Scenario: СТС нет под рукой — продавец заполняет характеристики сам', async () => {
    server.on('POST', BACKEND.saleCar.draft, { status: 201, body: draft({ brand: null, model: null, year: null, milleage: null }) })
    renderPage(<SellingWizardPage />, { at: '/sell', route: '/sell' })

    fireEvent.click(await screen.findByRole('button', { name: 'Заполнить вручную' }))

    expect(await screen.findByTestId('step-specs-manual')).toBeInTheDocument()
  })
})
