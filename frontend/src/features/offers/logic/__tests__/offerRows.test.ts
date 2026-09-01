import { describe, expect, it } from 'vitest'
import { toOfferRow } from '../offerRows'
import type { OfferListItemWire } from '../../api/offersApi'

const now = new Date(2026, 7, 28, 12, 0)

const wire: OfferListItemWire = {
  id: 'o1',
  listing_id: 'l1',
  listing_title: 'Lexus LX 570',
  listing_year: 2012,
  listing_price: 4020000,
  photo_url: null,
  amount: 3850000,
  status: 'pending',
  created_at: new Date(2026, 7, 28, 10, 0).toISOString(),
  expires_at: new Date(2026, 7, 30, 12, 0).toISOString(),
  counterparty_name: 'Дмитрий',
  counterparty_rating: 4.6,
  can_review: false,
  review_id: null,
}

describe('строка оффера', () => {
  it('считает разрыв с ценой объявления и остаток срока', () => {
    const row = toOfferRow(wire, 'incoming', now)
    expect(row.amount).toBe('3\u202F850\u202F000 ₽')
    expect(row.gap).toBe('на 170\u202F000 ₽ ниже')
    expect(row.badge).toBe('ждёт ответа · 2 дня')
    expect(row.faded).toBe(false)
  })

  it('входящему живому офферу даёт решение, законченному — ничего', () => {
    expect(toOfferRow(wire, 'incoming', now).actions.map((a) => a.id)).toEqual([
      'accept',
      'reject',
      'message',
    ])
    const expired = toOfferRow({ ...wire, status: 'expired' }, 'incoming', now)
    expect(expired.actions).toEqual([])
    expect(expired.faded).toBe(true)
    expect(expired.badge).toBe('истёк')
  })

  // Право на отзыв называет сервер, а не статус: принятый оффер без права даёт один чат,
  // с правом — кнопку «оставить», с написанным отзывом — «изменить».
  it('отзыв предлагает по праву с сервера, а не по статусу', () => {
    const accepted = { ...wire, status: 'accepted' as const }
    expect(toOfferRow(accepted, 'outgoing', now).actions.map((a) => a.id)).toEqual(['chat'])
    expect(
      toOfferRow({ ...accepted, can_review: true }, 'outgoing', now).actions.map((a) => a.label),
    ).toEqual(['Открыть чат', 'Оставить отзыв'])
    expect(
      toOfferRow({ ...accepted, review_id: 'rv1' }, 'outgoing', now).actions.map((a) => a.label),
    ).toEqual(['Открыть чат', 'Изменить отзыв'])
    expect(toOfferRow({ ...wire, status: 'car_sold' }, 'outgoing', now).actions).toEqual([])
  })

  // Полученные офферы отзыва не дают никогда: оценка односторонняя.
  it('на полученном предложении кнопки отзыва нет', () => {
    expect(
      toOfferRow(
        { ...wire, status: 'accepted', can_review: true, review_id: 'rv1' },
        'incoming',
        now,
      ).actions,
    ).toEqual([])
  })

  it('предложение выше цены не показывает разрыв', () => {
    expect(toOfferRow({ ...wire, amount: 4100000 }, 'incoming', now).gap).toBeNull()
  })
})
