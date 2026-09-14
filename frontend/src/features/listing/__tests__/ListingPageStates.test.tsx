import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { ListingPage } from '../ListingPage'
import { renderPage } from '../../../test/renderPage'
import { BACKEND } from '../../../shared/api/backend/paths'
import { fakeServer, resetServer, signedIn, type FakeServer } from '../../../test/fakeServer'
import { listingOpener } from './listingFixture'

let server: FakeServer
const open = listingOpener(() => server)

beforeEach(() => {
  server = fakeServer()
})
afterEach(resetServer)

// Feature: Карточка объявления
describe('страница объявления: жалобы, владелец и состояния', () => {
  it('Scenario: жалоба уходит только с причиной', async () => {
    open()
    server.on('POST', BACKEND.moderation.complain('car1'), { status: 201, body: {} })

    fireEvent.click((await screen.findAllByTitle('Пожаловаться'))[0])
    const send = screen.getByRole('button', { name: 'Отправить жалобу' })
    expect(send).toBeDisabled()
    fireEvent.click(screen.getByText('Цена-приманка'))
    fireEvent.click(send)

    expect(await screen.findByTestId('complain-done')).toBeInTheDocument()
    expect(server.callsTo('POST', BACKEND.moderation.complain('car1'))[0].body).toEqual({
      reason: 'bait_price',
    })
  })

  it('Scenario: продавец открыл торг — вошедший покупатель видит чужие предложения', async () => {
    server.on('GET', BACKEND.offer.ofCar('car1'), {
      status: 200,
      body: [
        { offer_id: 'o1', price: 1750000, created_at: '2026-09-13T10:00:00', status: 'pending' },
      ],
    })
    open({ offers_visible: true })

    expect(await screen.findByText(/1\s750\s000/)).toBeInTheDocument()
  })

  it('Scenario: торг закрыт — покупатель за чужими предложениями не ходит', async () => {
    open()

    await screen.findByTestId('listing-side')
    expect(server.callsTo('GET', BACKEND.offer.ofCar('car1'))).toEqual([])
  })

  it('Scenario: владелец видит управление вместо торга и снимает объявление', async () => {
    server.on('GET', BACKEND.offer.ofCar('car1'), { status: 200, body: [] })
    server.on('POST', BACKEND.saleCar.withdraw('car1'), {
      status: 200,
      body: { status: 'withdrawn' },
    })
    open({}, 'seller')

    fireEvent.click(await screen.findByRole('button', { name: 'Снять с публикации' }))

    expect(screen.queryByTestId('offer-price')).toBeNull()
    await waitFor(() =>
      expect(server.callsTo('POST', BACKEND.saleCar.withdraw('car1'))).toHaveLength(1),
    )
  })

  it('Scenario: владелец с неполной картой видит, сколько панелей не замерено', async () => {
    server.on('GET', BACKEND.offer.ofCar('car1'), { status: 200, body: [] })
    open({ thickness: { measured_panels: 9, total_panels: 13, is_complete: false } }, 'seller')

    expect(await screen.findByText(/Не замерено панелей: 4/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Домерить' })).toBeInTheDocument()
  })

  it('Scenario: проданная машина — действия выключены, видна отметка «Продано»', async () => {
    open({ status: 'sold', updated_at: '2026-09-10T10:00:00' })

    expect(await screen.findByTestId('sold-mark')).toBeInTheDocument()
    expect(screen.queryByTestId('offer-price')).toBeNull()
  })

  it('Scenario: объявление сняли — страница говорит, что его не нашли', async () => {
    signedIn('buyer')
    server.on('GET', BACKEND.saleCar.one('car1'), {
      status: 404,
      body: { code: 'LISTING_NOT_FOUND', message: 'нет' },
    })
    renderPage(<ListingPage signedIn />, { at: '/l/car1', route: '/l/:listingId' })

    expect(
      await screen.findByText('Объявление не найдено — возможно, его сняли с публикации.'),
    ).toBeInTheDocument()
  })
})
