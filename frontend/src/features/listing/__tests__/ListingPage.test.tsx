import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { BACKEND } from '../../../shared/api/backend/paths'
import { fakeServer, resetServer, type FakeServer } from '../../../test/fakeServer'
import { listingOpener } from './listingFixture'

let server: FakeServer
const open = listingOpener(() => server)

beforeEach(() => {
  server = fakeServer()
})
afterEach(resetServer)

// Feature: Карточка объявления
describe('страница объявления: торг и связь', () => {
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
})
