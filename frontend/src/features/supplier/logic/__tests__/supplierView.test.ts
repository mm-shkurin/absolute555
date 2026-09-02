import { describe, expect, it } from 'vitest'
import { deliveriesLabel, toSupplierView } from '../supplierView'
import type { SupplierProfileWire } from '../../api/supplierApi'

const wire: SupplierProfileWire = {
  id: 's1',
  name: 'Восток-Авто',
  rating: 4.7,
  deliveries_count: 18,
  reviews_count: 18,
  member_since: 'июня 2026',
  approved: true,
  countries: ['Япония', 'Корея'],
  brands: ['Toyota', 'Lexus', 'Honda'],
  delivery_days: '45–70 дней',
  prepayment_percent: 30,
  about: 'Вожу с аукционов Японии пятый год.',
  listings: [],
}

describe('страница поставщика', () => {
  it('собирает таблицу условий, по которой поставщиков сравнивают', () => {
    const view = toSupplierView(wire)
    expect(view.terms).toEqual([
      { label: 'Страны', value: 'Япония, Корея' },
      { label: 'Марки', value: 'Toyota, Lexus, Honda' },
      { label: 'Срок доставки', value: '45–70 дней' },
      { label: 'Предоплата', value: '30% при заказе' },
    ])
    expect(view.line).toBe('4,7 · 18 сделок · на площадке с июня 2026')
  })

  it('пустые ограничения называет словами', () => {
    const view = toSupplierView({ ...wire, countries: [], brands: [] })
    expect(view.terms[0].value).toBe('не указаны')
    expect(view.terms[1].value).toBe('любые')
  })

  it('неодобренный поставщик отмечен как таковой', () => {
    expect(toSupplierView({ ...wire, approved: false }).approved).toBe(false)
  })

  it('поставки склоняются как поставки, а не как сделки', () => {
    expect(deliveriesLabel(18)).toBe('18 поставок')
    expect(deliveriesLabel(2)).toBe('2 поставки')
    expect(deliveriesLabel(1)).toBe('1 поставка')
  })
})
