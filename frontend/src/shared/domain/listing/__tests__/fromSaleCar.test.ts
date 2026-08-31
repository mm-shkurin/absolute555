import { describe, expect, it } from 'vitest'
import { toListingWire } from '../fromSaleCar'
import type { SaleCarWire } from '../../../api/backend/saleCarContract'

const wire = (over: Partial<SaleCarWire> = {}): SaleCarWire => ({
  sale_car_id: 'c1',
  user_id: 'u1',
  vin: 'XW8ZZZ61ZJG012345',
  brand: 'Toyota',
  model: 'Camry',
  mark_raw: null,
  model_raw: null,
  year: 2019,
  transmission: 'автомат',
  engine_power: 181,
  task_id: null,
  task_status: null,
  phone_number: '+79000000000',
  price: 1390000,
  milleage: 96400,
  description: null,
  status: 'published',
  reject_reason: null,
  reject_label: null,
  published_at: null,
  created_at: null,
  updated_at: null,
  car_data: null,
  preview_photo_url: 'https://s3/preview.jpg',
  photos: [],
  autofill: null,
  seller: null,
  ...over,
})

describe('перевод объявления с сервера в форму карточки', () => {
  it('берёт пробег из поля milleage, как его называет сервер', () => {
    expect(toListingWire(wire()).mileage_km).toBe(96400)
  })

  it('подставляет марку из документа, когда справочник её не связал', () => {
    const view = toListingWire(
      wire({ brand: null, model: null, mark_raw: 'ТОЙОТА', model_raw: 'КАМРИ' }),
    )
    expect(view.brand).toBe('ТОЙОТА')
    expect(view.model).toBe('КАМРИ')
  })

  it('считает VIN проверенным только когда он пришёл в ответе', () => {
    expect(toListingWire(wire()).vin_verified).toBe(true)
    expect(toListingWire(wire({ vin: null })).vin_verified).toBe(false)
  })

  it('не обещает карту замеров: замеров на сервере ещё нет', () => {
    expect(toListingWire(wire()).has_thickness_map).toBe(false)
  })

  it('оставляет город пустым, а не выдумывает его', () => {
    expect(toListingWire(wire()).city).toBeNull()
  })
})
