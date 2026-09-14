import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { ListingPage } from '../ListingPage'
import { BACKEND } from '../../../shared/api/backend/paths'
import { renderPage } from '../../../test/renderPage'
import { fakeServer, resetServer, signedIn, type FakeServer } from '../../../test/fakeServer'

// Копия `GET /sale_car/{id}` опубликованного объявления.
const car = (over: Record<string, unknown> = {}) => ({
  sale_car_id: 'car1',
  user_id: 'seller',
  vin: 'XW8ZZZ61ZJG012345',
  brand: 'Lexus',
  model: 'GS',
  mark_raw: null,
  model_raw: null,
  year: 2012,
  transmission: 'АКПП',
  engine_power: 249,
  phone_number: null,
  price: 1900000,
  milleage: 96400,
  description: 'Один владелец',
  status: 'published',
  published_at: '2026-09-01T10:00:00',
  updated_at: '2026-09-01T10:00:00',
  photos: [],
  phone_visible: true,
  chat_allowed: true,
  offers_visible: false,
  moderation: null,
  autofill: null,
  seller: { user_id: 'seller', name: 'Дмитрий', avatar_url: null, rating: 4.8, deals_count: 3 },
  thickness: null,
  listing_kind: 'stock',
  import_country: null,
  delivery_days: null,
  turnkey_price: null,
  ...over,
})

let server: FakeServer

function open(
  over: Record<string, unknown> = {},
  viewer: string | null = 'buyer',
  onSignIn = vi.fn(),
) {
  if (viewer) signedIn(viewer)
  server.on('GET', BACKEND.saleCar.one('car1'), { status: 200, body: car(over) })
  renderPage(<ListingPage signedIn={viewer !== null} onSignIn={onSignIn} />, {
    at: '/l/car1',
    route: '/l/:listingId',
  })
  return onSignIn
}

beforeEach(() => {
  server = fakeServer()
})
afterEach(resetServer)

// Feature: Карточка объявления
describe('страница объявления', () => {
  it('Scenario: гость нажимает «Предложить цену» — его ведут на вход, а не прячут кнопку', async () => {
    // Given гость открыл карточку Lexus GS
    const onSignIn = open({}, null)
    // When нажимает «Предложить цену»
    fireEvent.click(await screen.findByTestId('offer-price'))
    // Then начинается вход, предложение не уходит
    expect(onSignIn).toHaveBeenCalledTimes(1)
    expect(server.callsTo('POST', BACKEND.offer.collection)).toEqual([])
  })

  it('Scenario: покупатель предлагает цену с пробелами — продавцу уходит число', async () => {
    open()
    server.on('POST', BACKEND.offer.collection, {
      status: 201,
      body: { offer_id: 'o1', price: 1750000 },
    })

    fireEvent.click(await screen.findByTestId('offer-price'))
    fireEvent.change(screen.getByTestId('offer-input'), { target: { value: '1 750 000' } })
    fireEvent.click(screen.getByTestId('offer-send'))

    expect(await screen.findByTestId('offer-sent')).toBeInTheDocument()
    expect(server.callsTo('POST', BACKEND.offer.collection)[0].body).toEqual({
      sale_car_id: 'car1',
      price: 1750000,
    })
  })

  it('Scenario: машину уже продали — отказ показан в шторке словами', async () => {
    open()
    server.on('POST', BACKEND.offer.collection, {
      status: 409,
      body: { code: 'LISTING_SOLD', message: 'sold' },
    })

    fireEvent.click(await screen.findByTestId('offer-price'))
    fireEvent.change(screen.getByTestId('offer-input'), { target: { value: '1750000' } })
    fireEvent.click(screen.getByTestId('offer-send'))

    expect(
      await screen.findByText('Машину уже продали. Предложение отправить нельзя.'),
    ).toBeInTheDocument()
  })

  it('Scenario: покупатель раскрывает телефон продавца', async () => {
    open()
    server.on('POST', BACKEND.saleCar.revealPhone('car1'), {
      status: 200,
      body: { phone_number: '+7 913 000-00-00' },
    })

    fireEvent.click(await screen.findByRole('button', { name: 'Показать телефон' }))

    expect((await screen.findByTestId('revealed-phone')).textContent).toBe('+7 913 000-00-00')
  })

  it('Scenario: продавец скрыл телефон — кнопка выключена, связь через чат', async () => {
    open({ phone_visible: false })

    expect(await screen.findByRole('button', { name: 'Показать телефон' })).toBeDisabled()
    expect(screen.getByText('Продавец скрыл телефон — связь только через чат.')).toBeInTheDocument()
  })

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
