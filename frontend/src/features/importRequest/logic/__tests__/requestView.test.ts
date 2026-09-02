import { describe, expect, it } from 'vitest'
import { bidsTitle, responsesLine, toBidViews, toRequestView } from '../requestView'
import type {
  BuyerRequestWire,
  SupplierResponseWire,
} from '../../../../shared/api/backend/requestContract'

const request: BuyerRequestWire = {
  request_id: 'r1',
  user_id: 'u1',
  brand: 'Toyota',
  model: 'Alphard',
  year_from: 2019,
  budget_max: 6500000,
  comment: 'Хочу белый, без пробега по России.',
  status: 'open',
  responses_count: 2,
  created_at: new Date(2026, 7, 24).toISOString(),
}

const response = (over: Partial<SupplierResponseWire>): SupplierResponseWire => ({
  response_id: 'rs1',
  request_id: 'r1',
  supplier_id: 'u9',
  price: 6690000,
  delivery_days: 60,
  comment: null,
  updated_at: null,
  ...over,
})

describe('заявка на привоз', () => {
  it('называет машину, год от и бюджет под ключ', () => {
    const view = toRequestView(request)
    expect(view.title).toBe('Toyota Alphard')
    expect(view.specs.find((row) => row.label === 'Год')?.value).toBe('от 2019')
    expect(view.specs.find((row) => row.label === 'Бюджет под ключ')?.value).toContain('до')
    expect(view.active).toBe(true)
  })

  it('заявка без марки и бюджета не притворяется заполненной', () => {
    const view = toRequestView({ ...request, brand: null, model: null, budget_max: null })
    expect(view.title).toBe('Заявка на привоз')
    expect(view.specs.find((row) => row.label === 'Бюджет под ключ')?.value).toBe('не назван')
  })

  it('закрытая заявка отмечена закрытой', () => {
    expect(toRequestView({ ...request, status: 'closed' }).active).toBe(false)
  })

  it('склоняет отклики', () => {
    expect(responsesLine(1)).toBe('1 отклик')
    expect(responsesLine(2)).toBe('2 отклика')
    expect(responsesLine(5)).toBe('5 откликов')
    expect(bidsTitle(2)).toBe('Отклики · 2')
  })
})

describe('отклики поставщиков', () => {
  it('помечает самый дешёвый, но порядок не меняет', () => {
    const views = toBidViews([
      response({ response_id: 'a', price: 6900000 }),
      response({ response_id: 'b', price: 6690000, supplier_id: 'u8' }),
    ])
    expect(views.map((one) => one.id)).toEqual(['a', 'b'])
    expect(views[0].cheapest).toBe(false)
    expect(views[1].cheapest).toBe(true)
  })

  it('срок называет днями, а цену — ценой под ключ', () => {
    const [view] = toBidViews([response({ delivery_days: 45 })])
    expect(view.terms).toBe('под ключ · 45 дней')
    expect(view.price).toContain('690')
  })
})
