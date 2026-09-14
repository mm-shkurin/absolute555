import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { ModerationQueuePage } from '../ModerationQueuePage'
import { BACKEND } from '../../../shared/api/backend/paths'
import { renderPage } from '../../../test/renderPage'
import { fakeServer, resetServer, signedIn, type FakeServer } from '../../../test/fakeServer'

const item = (id: string, brand: string) => ({
  sale_car_id: id,
  brand,
  model: 'GS',
  year: 2012,
  price: 1900000,
  status: 'review',
  preview_photo_url: null,
  listing_kind: 'stock',
  thickness: { measured_panels: 13, total_panels: 13, is_complete: true },
  seller: { user_id: 'u9', name: 'Дмитрий', avatar_url: null, rating: 4.8, deals_count: 3 },
  open_complaints: 0,
  submitted_at: null,
})

let server: FakeServer

function queue(...items: ReturnType<typeof item>[]) {
  server.on('GET', BACKEND.moderation.queue, { status: 200, body: { items, total: items.length, page: 1, size: 20 } })
  server.on('GET', BACKEND.moderation.counts, { status: 200, body: { waiting: items.length, complained: 0, handled_today: 0 } })
}

beforeEach(() => {
  server = fakeServer()
  signedIn('m1', 'manager')
})
afterEach(resetServer)

// Feature: Модератор разбирает очередь, не уходя со страницы
describe('страница очереди модерации', () => {
  it('Scenario: первая карточка очереди открыта на проверку сразу', async () => {
    // Given в очереди Lexus и Toyota
    queue(item('car1', 'Lexus'), item('car2', 'Toyota'))
    // When модератор открывает очередь
    renderPage(<ModerationQueuePage />)
    // Then обе строки видны, а на проверке — первая
    const panel = await screen.findByTestId('review-panel')
    expect(screen.getAllByTestId('queue-row')).toHaveLength(2)
    expect(within(panel).getByRole('heading').textContent).toBe('Lexus GS · 2012')
  })

  it('Scenario: выбор строки открывает её на проверку', async () => {
    queue(item('car1', 'Lexus'), item('car2', 'Toyota'))
    renderPage(<ModerationQueuePage />)

    fireEvent.click((await screen.findAllByTestId('queue-row'))[1])

    expect(within(screen.getByTestId('review-panel')).getByRole('heading').textContent).toBe('Toyota GS · 2012')
  })

  it('Scenario: модератор публикует объявление — запрос уходит по выбранной машине', async () => {
    queue(item('car1', 'Lexus'))
    server.on('POST', BACKEND.saleCar.approve('car1'), { status: 200, body: { status: 'published' } })
    renderPage(<ModerationQueuePage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Опубликовать' }))

    await waitFor(() => expect(server.callsTo('POST', BACKEND.saleCar.approve('car1'))).toHaveLength(1))
  })

  it('Scenario: отклонить без причины нельзя — кнопка отправки неактивна до выбора причины', async () => {
    queue(item('car1', 'Lexus'))
    server.on('POST', BACKEND.saleCar.reject('car1'), { status: 200, body: { status: 'rejected' } })
    renderPage(<ModerationQueuePage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Отклонить с причиной' }))
    const send = screen.getByRole('button', { name: 'Отклонить и отправить причину' })
    expect(send).toBeDisabled()
    fireEvent.click(screen.getByText('Мало фотографий'))
    fireEvent.click(send)

    await waitFor(() =>
      expect(server.callsTo('POST', BACKEND.saleCar.reject('car1'))[0]?.body).toEqual({ label: 'too_few_photos' }),
    )
  })

  it('Scenario: очередь пуста — страница говорит, что всё проверено', async () => {
    queue()
    renderPage(<ModerationQueuePage />)

    expect(await screen.findByText('Очередь пуста')).toBeInTheDocument()
  })

  it('Scenario: решение не принято сервером — модератор видит причину', async () => {
    queue(item('car1', 'Lexus'))
    server.on('POST', BACKEND.saleCar.approve('car1'), { status: 409, body: { code: 'X', message: 'уже решено' } })
    renderPage(<ModerationQueuePage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Опубликовать' }))

    expect(await screen.findByText('Данные успели измениться. Обновите страницу и попробуйте снова.')).toBeInTheDocument()
  })
})
