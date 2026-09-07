import { describe, expect, it } from 'vitest'
import { toShowcaseCar } from '../showcaseView'
import type { FeedCardWire } from '../../../../shared/api/backend/feedContract'

const card = (over: Partial<FeedCardWire> = {}): FeedCardWire => ({
  sale_car_id: 'a1',
  brand: 'Toyota',
  model: 'Camry',
  year: 2019,
  price: 2450000,
  milleage: 96400,
  transmission: 'автомат',
  status: 'published',
  preview_photo_url: 'https://cdn/1.jpg',
  published_at: null,
  listing_kind: 'stock',
  import_country: null,
  delivery_days: null,
  turnkey_price: null,
  thickness: { measured_panels: 3, total_panels: 5, is_complete: false },
  ...over,
})

describe('карточка витрины лендинга', () => {
  it('Показывает марку, модель и год одной строкой', () => {
    expect(toShowcaseCar(card()).name).toBe('Toyota Camry, 2019')
  })

  it('Закрашивает столько делений шкалы, сколько панелей промерено', () => {
    expect(toShowcaseCar(card()).panels).toEqual(['ok', 'ok', 'ok', 'none', 'none'])
  })

  it('Оставляет шкалу пустой, когда замеров нет вовсе', () => {
    const panels = toShowcaseCar(card({ thickness: null })).panels
    expect(new Set(panels)).toEqual(new Set(['none']))
    expect(panels).toHaveLength(13)
  })

  it('Метит полной картой только объявление с полным набором замеров', () => {
    expect(toShowcaseCar(card()).tag).toBeUndefined()
    const full = { measured_panels: 5, total_panels: 5, is_complete: true }
    expect(toShowcaseCar(card({ thickness: full })).tag).toBe('full')
  })

  it('Машину под заказ метит каналом и показывает срок вместо пробега', () => {
    const car = toShowcaseCar(
      card({
        listing_kind: 'import',
        import_country: 'Корея',
        delivery_days: 60,
        turnkey_price: 3100000,
        milleage: null,
      }),
    )
    expect(car.tag).toBe('import')
    expect(car.meta).toBe('Корея · под ключ · 60 дней · автомат')
  })

  it('Ведёт на объявление и несёт его обложку', () => {
    const car = toShowcaseCar(card())
    expect(car.id).toBe('a1')
    expect(car.photoUrl).toBe('https://cdn/1.jpg')
  })
})
