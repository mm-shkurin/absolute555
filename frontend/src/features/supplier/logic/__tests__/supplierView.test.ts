import { describe, expect, it } from 'vitest'
import { deliveriesLabel, toSupplierView } from '../supplierView'
import type { SupplierPageWire } from '../../api/supplierApi'

const wire: SupplierPageWire = {
  profile: {
    user_id: 'u9',
    company_name: 'Восток-Авто',
    countries: ['Япония', 'Корея'],
    brands: ['Toyota', 'Lexus', 'Honda'],
    delivery_days_min: 45,
    delivery_days_max: 70,
    terms: 'Предоплата 30% при заказе',
    description: 'Вожу с аукционов Японии пятый год.',
    status: 'published',
    reject_reason: null,
    updated_at: null,
  },
  seller: {
    user_id: 'u9',
    name: 'Дмитрий',
    avatar_url: null,
    rating: 4.7,
    reviews_count: 18,
    deals_count: 18,
    listings_count: 3,
    member_since: 'июня 2026',
  },
  listings: [],
}

describe('страница поставщика', () => {
  it('собирает таблицу условий, по которой поставщиков сравнивают', () => {
    const view = toSupplierView(wire)
    expect(view.terms).toEqual([
      { label: 'Страны', value: 'Япония, Корея' },
      { label: 'Марки', value: 'Toyota, Lexus, Honda' },
      { label: 'Срок доставки', value: '45–70 дней' },
      { label: 'Условия', value: 'Предоплата 30% при заказе' },
    ])
    expect(view.line).toBe('4,7 · 18 сделок · на площадке с июня 2026')
  })

  it('пустые ограничения называет словами, а не пустотой', () => {
    const view = toSupplierView({
      ...wire,
      profile: { ...wire.profile, countries: [], brands: [], delivery_days_min: null, terms: null },
    })
    expect(view.terms[0].value).toBe('не указаны')
    expect(view.terms[1].value).toBe('любые')
    expect(view.terms[2].value).toBe('не указан')
    expect(view.terms[3].value).toBe('по договорённости')
  })

  it('без названия компании подписывается именем человека', () => {
    const view = toSupplierView({ ...wire, profile: { ...wire.profile, company_name: null } })
    expect(view.name).toBe('Дмитрий')
  })

  it('рейтинг берётся из блока продавца: отдельного агрегата у поставщика нет', () => {
    expect(toSupplierView(wire).rating).toBe(4.7)
    expect(toSupplierView(wire).reviewsTitle).toBe('Отзывы · 18')
  })

  it('поставки склоняются как поставки, а не как сделки', () => {
    expect(deliveriesLabel(18)).toBe('18 поставок')
    expect(deliveriesLabel(2)).toBe('2 поставки')
    expect(deliveriesLabel(1)).toBe('1 поставка')
  })
})
