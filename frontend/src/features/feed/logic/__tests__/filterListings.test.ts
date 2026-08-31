import { describe, expect, it } from 'vitest'
import { applyQuery } from '../filterListings'
import { EMPTY_QUERY } from '../feedQuery'
import type { ListingWire } from '../../../../shared/domain/listing/listingWire'

const car = (over: Partial<ListingWire>): ListingWire => ({
  id: 'a1',
  brand: 'Toyota',
  model: 'Camry',
  year: 2019,
  price: 1390000,
  mileage_km: 96400,
  engine_power_hp: 181,
  transmission: 'автомат',
  city: null,
  photo_url: null,
  has_thickness_map: false,
  vin_verified: true,
  import_delivery_days: null,
  ...over,
})

describe('отбор ленты на клиенте', () => {
  it('оставляет объявления в границах цены', () => {
    const cars = [car({ id: 'a', price: 700000 }), car({ id: 'b', price: 1500000 })]
    const found = applyQuery(cars, { ...EMPTY_QUERY, priceFrom: '1000000' })
    expect(found.map((item) => item.id)).toEqual(['b'])
  })

  it('сравнивает марку без учёта регистра', () => {
    const cars = [car({ id: 'a', brand: 'Toyota' }), car({ id: 'b', brand: 'Kia' })]
    expect(applyQuery(cars, { ...EMPTY_QUERY, brand: 'toyota' }).map((c) => c.id)).toEqual(['a'])
  })

  it('не прячет объявление без пробега, пока по пробегу не фильтруют', () => {
    const cars = [car({ id: 'a', mileage_km: null })]
    expect(applyQuery(cars, EMPTY_QUERY)).toHaveLength(1)
    expect(applyQuery(cars, { ...EMPTY_QUERY, mileageTo: '100000' })).toHaveLength(0)
  })

  it('по коробке отбирает только точное совпадение и отсеивает объявления без коробки', () => {
    const cars = [
      car({ id: 'a', transmission: 'автомат' }),
      car({ id: 'b', transmission: 'механика' }),
      car({ id: 'c', transmission: null }),
    ]
    const found = applyQuery(cars, { ...EMPTY_QUERY, transmissions: ['автомат'] })
    expect(found.map((item) => item.id)).toEqual(['a'])
  })

  it('вкладка «под заказ» пуста: канала под заказ на сервере пока нет', () => {
    expect(applyQuery([car({})], { ...EMPTY_QUERY, tab: 'import' })).toEqual([])
  })

  it('фильтр по карте замеров не оставляет ничего, пока замеров нет в ответе', () => {
    expect(applyQuery([car({})], { ...EMPTY_QUERY, withThicknessMap: true })).toEqual([])
  })

  it('сортирует по цене и сохраняет порядок сервера для «сначала новые»', () => {
    const cars = [car({ id: 'a', price: 900000 }), car({ id: 'b', price: 300000 })]
    expect(applyQuery(cars, { ...EMPTY_QUERY, sort: 'price-asc' }).map((c) => c.id)).toEqual([
      'b',
      'a',
    ])
    expect(applyQuery(cars, EMPTY_QUERY).map((c) => c.id)).toEqual(['a', 'b'])
  })
})
