import { describe, expect, it } from 'vitest'
import { countLabel, toListingView } from '../listingView'
import { formatPrice } from '../../../format/money'
import type { ListingWire } from '../listingWire'

const base: ListingWire = {
  id: 'a1',
  brand: 'Toyota',
  model: 'Camry',
  year: 2019,
  price: 2340000,
  mileage_km: 86000,
  engine_power_hp: 181,
  transmission: 'АКПП',
  city: 'Омск',
  photo_url: null,
  has_thickness_map: true,
  vin_verified: true,
  import_delivery_days: null,
}

describe('форматирование объявления для ленты', () => {
  it('разбивает цену по разрядам неразрывным пробелом', () => {
    expect(formatPrice(2340000)).toBe('2\u202F340\u202F000 ₽')
  })

  it('собирает строку характеристик из пробега, мощности и коробки', () => {
    expect(toListingView(base).spec).toBe('86\u202F000 км · 181 л.с. · АКПП')
  })

  it('у машины под заказ вместо пробега стоит срок доставки, а VIN отмечен отсутствующим', () => {
    const view = toListingView({ ...base, mileage_km: null, import_delivery_days: '55–70 дней' })
    expect(view.spec).toBe('срок доставки 55–70 дней · 181 л.с. · АКПП')
    expect(view.vinNote).toBe('без VIN')
    expect(view.isImport).toBe(true)
  })

  it('согласует слово «объявление» с числом', () => {
    expect(countLabel(1)).toBe('1 объявление')
    expect(countLabel(3)).toBe('3 объявления')
    expect(countLabel(11)).toBe('11 объявлений')
    expect(countLabel(248)).toBe('248 объявлений')
  })
})
