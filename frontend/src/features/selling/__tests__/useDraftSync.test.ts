import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDraftSync } from '../useDraftSync'
import { EMPTY_DRAFT } from '../logic/draft'
import { BACKEND } from '../../../shared/api/backend/paths'
import { fakeServer, resetServer, signedIn, type FakeServer } from '../../../test/fakeServer'

// Черновик в форме `SaleCarResponse`: только поля, которые читает мастер.
const car = (over: Record<string, unknown> = {}) => ({
  sale_car_id: 'car1',
  brand: 'Lexus',
  model: 'GS',
  mark_raw: null,
  model_raw: null,
  year: 2012,
  transmission: null,
  engine_power: null,
  vin: null,
  price: 1900000,
  milleage: 96400,
  phone_number: null,
  description: null,
  photos: [],
  autofill: null,
  thickness: null,
  listing_kind: 'stock',
  import_country: null,
  delivery_days: null,
  turnkey_price: null,
  ...over,
})

let server: FakeServer

beforeEach(() => {
  server = fakeServer()
  signedIn()
  window.history.replaceState(null, '', '/sell')
})
afterEach(resetServer)

describe('черновик мастера на сервере', () => {
  it('Scenario: ушёл и вернулся — открывается начатый черновик, а не новый', async () => {
    // Given продавец начал черновик Lexus GS с ценой 1 900 000 ₽ и ушёл из мастера
    server.on('GET', BACKEND.saleCar.one('car1'), { status: 200, body: car() })
    // When возвращается по ссылке «Продолжить»
    const { result } = renderHook(() => useDraftSync(true, 'car1'))
    const loaded = await result.current.reload()
    // Then мастер показывает введённое, и второй черновик не заводится
    expect(loaded?.brand.value).toBe('Lexus')
    expect(loaded?.price).toBe('1900000')
    expect(server.callsTo('POST', BACKEND.saleCar.draft)).toEqual([])
  })

  it('Scenario: новый черновик заводится один раз и запоминается в адресе', async () => {
    server.on('POST', BACKEND.saleCar.draft, { status: 201, body: car({ sale_car_id: 'new1' }) })

    const { result } = renderHook(() => useDraftSync(true))

    await waitFor(() => expect(result.current.saleCarId).toBe('new1'))
    expect(server.callsTo('POST', BACKEND.saleCar.draft)).toHaveLength(1)
    expect(window.location.pathname).toBe('/sell/new1')
  })

  it('Scenario: цена, введённая на шаге, сохраняется на сервере числом', async () => {
    server.on('PATCH', BACKEND.saleCar.one('car1'), { status: 200, body: car() })
    const { result } = renderHook(() => useDraftSync(true, 'car1'))

    await result.current.save({ ...EMPTY_DRAFT, price: '4 020 000' })

    expect(server.callsTo('PATCH', BACKEND.saleCar.one('car1'))[0].body).toEqual({ price: 4020000 })
    await waitFor(() => expect(result.current.saved).toBe(true))
  })

  it('пустой шаг не отправляет правку — сервер отверг бы её', async () => {
    const { result } = renderHook(() => useDraftSync(true, 'car1'))

    await result.current.save(EMPTY_DRAFT)

    expect(server.calls).toEqual([])
  })

  it('Scenario: VIN, вписанный руками, уходит на распознавание', async () => {
    // Given снимок прочитан, а VIN в нём — нет
    server.on('POST', BACKEND.saleCar.decodeVin('car1'), { status: 202, body: { task_id: 't1' } })
    const { result } = renderHook(() => useDraftSync(true, 'car1'))
    // When продавец вписывает VIN
    const accepted = await result.current.decodeByVin('XW8ZZZ61ZJG012345')
    // Then сервер получает VIN полем запроса
    expect(accepted).toBe(true)
    expect(server.callsTo('POST', BACKEND.saleCar.decodeVin('car1'))[0].body).toEqual({
      vin: 'XW8ZZZ61ZJG012345',
    })
  })

  it('Scenario: снимок СТС не принят — мастер остаётся на шаге документа', async () => {
    server.on('POST', BACKEND.saleCar.sts('car1'), { status: 413, body: {} })
    const { result } = renderHook(() => useDraftSync(true, 'car1'))

    expect(await result.current.attachDocument(new File(['x'], 'sts.jpg'))).toBe(false)
  })

  it('черновик, которого не прочитать, не подменяет введённое пустым', async () => {
    server.on('GET', BACKEND.saleCar.one('car1'), { status: 500, body: {} })
    const { result } = renderHook(() => useDraftSync(true, 'car1'))

    expect(await result.current.reload()).toBeNull()
  })
})
