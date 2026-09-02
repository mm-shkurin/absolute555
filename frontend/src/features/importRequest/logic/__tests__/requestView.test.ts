import { describe, expect, it } from 'vitest'
import { toBidViews, toRequestView } from '../requestView'
import type { BidWire, RequestWire } from '../../api/requestApi'

const wire: RequestWire = {
  id: 'r1',
  title: 'Toyota Land Cruiser 300',
  years: '2022–2023',
  budget_max: 12000000,
  mileage_max_km: 60000,
  countries: ['Япония', 'Корея', 'ОАЭ'],
  wait_days_max: 90,
  comment: 'Нужна комплектация не ниже средней.',
  created_at: new Date(2026, 7, 20).toISOString(),
  active: true,
  owned_by_me: true,
}

const bid = (id: string, price: number): BidWire => ({
  id,
  supplier_id: `s-${id}`,
  supplier_name: 'Восток-Авто',
  rating: 4.7,
  deliveries_count: 18,
  comment: 'Есть лот 2022 года.',
  price,
  delivery_days: 65,
})

describe('заявка на привоз', () => {
  it('переводит условия заявки в читаемые строки', () => {
    const view = toRequestView(wire)
    expect(view.specs.map((row) => row.value)).toEqual([
      'Toyota Land Cruiser 300',
      '2022–2023',
      'до 12\u202F000\u202F000 ₽',
      'до 60\u202F000 км',
      'Япония, Корея, ОАЭ',
      'до 90 дней',
    ])
    expect(view.subtitle).toBe('Заявка на привоз · создана 20 августа')
  })

  it('незаполненные ограничения называет словами, а не прочерком', () => {
    const view = toRequestView({
      ...wire,
      budget_max: null,
      countries: [],
      wait_days_max: null,
    })
    const values = view.specs.map((row) => row.value)
    expect(values[2]).toBe('не назван')
    expect(values[4]).toBe('откуда угодно')
    expect(values[5]).toBe('без ограничения')
  })

  it('помечает самый дешёвый отклик, не переставляя порядок', () => {
    const views = toBidViews([bid('b1', 11400000), bid('b2', 10900000), bid('b3', 12800000)])
    expect(views.map((view) => view.id)).toEqual(['b1', 'b2', 'b3'])
    expect(views.map((view) => view.cheapest)).toEqual([false, true, false])
    expect(views[0].price).toBe('11\u202F400\u202F000 ₽')
    expect(views[0].terms).toBe('под ключ · 65 дней')
    expect(views[0].ratingLine).toBe('4,7 · 18 поставок')
  })
})
