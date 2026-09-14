import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { SupplierQueuePage } from '../SupplierQueuePage'
import { BACKEND } from '../../../shared/api/backend/paths'
import { renderPage } from '../../../test/renderPage'
import { fakeServer, resetServer, signedIn, type FakeServer } from '../../../test/fakeServer'

// Копия элемента `GET /moderation/suppliers`.
const profile = (over: Record<string, unknown> = {}) => ({
  user_id: 's1',
  company_name: 'Токио Авто',
  cover_url: null,
  countries: ['Япония'],
  brands: ['Toyota', 'Lexus'],
  delivery_days_min: 40,
  delivery_days_max: 60,
  terms: 'Предоплата 30%',
  description: null,
  status: 'pending',
  pending_changes: null,
  pending_cover_url: null,
  ...over,
})

let server: FakeServer

function queue(...items: ReturnType<typeof profile>[]) {
  server.on('GET', BACKEND.moderation.suppliers, {
    status: 200,
    body: { items, total: items.length },
  })
}

beforeEach(() => {
  server = fakeServer()
  signedIn('m1', 'manager')
})
afterEach(resetServer)

// Feature: Витрина поставщика проходит проверку
describe('очередь витрин поставщиков', () => {
  it('Scenario: модератор видит условия витрины — страны, марки, срок', async () => {
    // Given «Токио Авто» отправила витрину на проверку
    queue(profile())
    // When модератор открывает очередь витрин
    renderPage(<SupplierQueuePage />)
    // Then видны название, страны, марки, срок и условия
    expect(await screen.findByText('Токио Авто')).toBeInTheDocument()
    expect(screen.getByText('Япония · Toyota, Lexus · 40–60 дней')).toBeInTheDocument()
    expect(screen.getByText('Предоплата 30%')).toBeInTheDocument()
  })

  it('Scenario: правка опубликованной витрины показана поверх прежних полей', async () => {
    queue(
      profile({ pending_changes: { company_name: 'Токио Авто Импорт', terms: 'Без предоплаты' } }),
    )
    renderPage(<SupplierQueuePage />)

    expect(await screen.findByText('Токио Авто Импорт')).toBeInTheDocument()
    expect(screen.getByText('Без предоплаты')).toBeInTheDocument()
  })

  it('Scenario: публикация витрины уходит на сервер', async () => {
    queue(profile())
    server.on('POST', BACKEND.moderation.approveSupplier('s1'), {
      status: 200,
      body: profile({ status: 'approved' }),
    })
    renderPage(<SupplierQueuePage />)

    fireEvent.click(await screen.findByTestId('supplier-approve'))

    await waitFor(() =>
      expect(server.callsTo('POST', BACKEND.moderation.approveSupplier('s1'))).toHaveLength(1),
    )
  })

  it('Scenario: отказ витрине только с причиной — причина уходит на сервер', async () => {
    queue(profile())
    server.on('POST', BACKEND.moderation.rejectSupplier('s1'), {
      status: 200,
      body: profile({ status: 'rejected' }),
    })
    renderPage(<SupplierQueuePage />)

    const reject = await screen.findByTestId('supplier-reject')
    expect(reject).toBeDisabled()
    fireEvent.change(screen.getByTestId('supplier-reason'), {
      target: { value: 'Нет условий доставки' },
    })
    fireEvent.click(reject)

    await waitFor(() =>
      expect(server.callsTo('POST', BACKEND.moderation.rejectSupplier('s1'))[0]?.body).toEqual({
        reason: 'Нет условий доставки',
      }),
    )
  })

  it('Scenario: витрина без срока доставки так и названа', async () => {
    queue(profile({ delivery_days_min: null, delivery_days_max: null, countries: [], brands: [] }))
    renderPage(<SupplierQueuePage />)

    expect(
      await screen.findByText('страны не указаны · любые марки · срок не указан'),
    ).toBeInTheDocument()
  })

  it('Scenario: очередь пуста — страница объясняет, где ждут заявки на роль', async () => {
    queue()
    renderPage(<SupplierQueuePage />)

    expect(await screen.findByText('Очередь пуста')).toBeInTheDocument()
  })
})
