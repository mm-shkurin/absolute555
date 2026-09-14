import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { ComplaintsPage } from '../ComplaintsPage'
import { BACKEND } from '../../../shared/api/backend/paths'
import { renderPage } from '../../../test/renderPage'
import { fakeServer, resetServer, signedIn, type FakeServer } from '../../../test/fakeServer'

const complaint = (id: string, reason: string, text: string) => ({
  complaint_id: id,
  sale_car_id: 'car1',
  author: { user_id: `b-${id}`, name: 'Анна', avatar_url: null },
  reason,
  text,
  status: 'open',
  created_at: '2026-09-10T10:15:00',
  handled_at: null,
})

const group = {
  sale_car_id: 'car1',
  listing: {
    sale_car_id: 'car1',
    brand: 'Lexus',
    model: 'GS',
    year: 2012,
    price: 1900000,
    preview_photo_url: null,
    published_at: '2026-09-01T08:00:00',
  },
  complaints: [
    complaint('c1', 'bait_price', 'Цена вдвое ниже рынка'),
    complaint('c2', 'sold_already', 'Продана вчера'),
  ],
}

let server: FakeServer

function complaints(...items: (typeof group)[]) {
  server.on('GET', BACKEND.moderation.complaints, {
    status: 200,
    body: { items, total: items.length, page: 1, size: 20 },
  })
}

beforeEach(() => {
  server = fakeServer()
  signedIn('m1', 'manager')
})
afterEach(resetServer)

// Feature: Модератор решает по совокупности жалоб
describe('страница жалоб', () => {
  it('Scenario: жалобы на одно объявление собраны в одну карточку', async () => {
    // Given на Lexus GS пожаловались дважды: цена и «уже продана»
    complaints(group)
    // When модератор открывает жалобы
    renderPage(<ComplaintsPage />)
    // Then одна карточка, счётчик «2 жалобы», обе причины словами и оба текста
    expect(await screen.findAllByTestId('complaint-case')).toHaveLength(1)
    expect(screen.getByText('2 жалобы')).toBeInTheDocument()
    expect(screen.getByText('Цена вдвое ниже рынка')).toBeInTheDocument()
    expect(screen.getByText(/причина: Машина уже продана/)).toBeInTheDocument()
  })

  it('Scenario: «Отклонить жалобы» закрывает все жалобы карточки, а не одну', async () => {
    complaints(group)
    server.on('POST', BACKEND.moderation.dismissComplaint('c1'), { status: 200, body: {} })
    server.on('POST', BACKEND.moderation.dismissComplaint('c2'), { status: 200, body: {} })
    renderPage(<ComplaintsPage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Отклонить жалобы' }))

    await waitFor(() => {
      expect(server.callsTo('POST', BACKEND.moderation.dismissComplaint('c1'))).toHaveLength(1)
      expect(server.callsTo('POST', BACKEND.moderation.dismissComplaint('c2'))).toHaveLength(1)
    })
  })

  it('Scenario: снятие с публикации начинается с выбора причины для продавца', async () => {
    complaints(group)
    server.on('POST', BACKEND.moderation.unpublish('car1'), {
      status: 200,
      body: { status: 'rejected' },
    })
    renderPage(<ComplaintsPage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Снять с публикации' }))
    expect(server.callsTo('POST', BACKEND.moderation.unpublish('car1'))).toEqual([])
    fireEvent.click(screen.getByText('Цена-приманка'))

    await waitFor(() =>
      expect(server.callsTo('POST', BACKEND.moderation.unpublish('car1'))[0]?.body).toEqual({
        label: 'bait_price',
      }),
    )
  })

  it('Scenario: жалоб нет — страница говорит, что всё разобрано', async () => {
    complaints()
    renderPage(<ComplaintsPage />)

    expect(await screen.findByText('Открытых жалоб нет')).toBeInTheDocument()
  })

  it('Scenario: жалобы не загрузились — модератор видит причину и может повторить', async () => {
    server.on('GET', BACKEND.moderation.complaints, { status: 503, body: {} })
    renderPage(<ComplaintsPage />)

    expect(
      await screen.findByText('Сервис временно недоступен. Мы уже знаем, попробуйте позже.'),
    ).toBeInTheDocument()
  })
})
