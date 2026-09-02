import { describe, expect, it } from 'vitest'
import { importCountLine, toRequestCard, toSupplierCard } from '../importView'
import type { ImportFeedWire } from '../../api/importApi'

const now = new Date(2026, 7, 28, 12, 0)

const empty: ImportFeedWire = {
  cars: [],
  suppliers: [],
  requests: [],
  cars_total: 34,
  suppliers_total: 7,
  requests_total: 12,
}

describe('лента под заказ', () => {
  it('счётчик называет все три сущности сразу', () => {
    expect(importCountLine(empty)).toBe('34 позиции · 7 поставщиков · 12 заявок')
  })

  it('карточка поставщика ставит срок и предоплату рядом', () => {
    const card = toSupplierCard({
      id: 's1',
      name: 'Восток-Авто',
      rating: 4.7,
      deliveries_count: 18,
      countries: ['Япония', 'Корея'],
      brands: ['Toyota', 'Lexus', 'Honda'],
      delivery_days: '45–70 дней',
      prepayment_percent: 30,
    })
    expect(card.ratingLine).toBe('4,7 · 18 поставок')
    expect(card.scope).toBe('Япония, Корея · Toyota, Lexus, Honda')
    expect(card.terms).toBe('45–70 дней · предоплата 30%')
  })

  it('заявка называет бюджет, отклики и когда создана', () => {
    const card = toRequestCard(
      {
        request_id: 'r1',
        user_id: 'u1',
        brand: 'Toyota',
        model: 'Land Cruiser 300',
        year_from: 2022,
        budget_max: 12000000,
        comment: null,
        status: 'open',
        responses_count: 4,
        created_at: new Date(2026, 7, 27).toISOString(),
      },
      now,
    )
    expect(card.title).toBe('Toyota Land Cruiser 300')
    expect(card.spec).toBe('от 2022 года')
    expect(card.budget).toBe('до 12\u202F000\u202F000 ₽')
    expect(card.meta).toBe('4 отклика · создана вчера')
  })

  it('заявка без бюджета говорит об этом, а не показывает пустоту', () => {
    const card = toRequestCard(
      {
        request_id: 'r2',
        user_id: 'u1',
        brand: 'Honda',
        model: 'Vezel',
        year_from: null,
        budget_max: null,
        comment: null,
        status: 'open',
        responses_count: 1,
        created_at: now.toISOString(),
      },
      now,
    )
    expect(card.spec).toBe('год любой')
    expect(card.budget).toBe('бюджет не назван')
    expect(card.meta).toBe('1 отклик · создана сегодня')
  })
})
