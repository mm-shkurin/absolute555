import { describe, expect, it } from 'vitest'
import { countByStatus, filterByStatus, toMyListingRow } from '../myListingRows'
import type { MyListingWire } from '../../api/myListingsApi'

const base: MyListingWire = {
  id: 'l1',
  title: 'Lexus LX 570',
  year: 2012,
  price: 4020000,
  mileage_km: 180000,
  status: 'published',
  photos_count: 7,
  measured_panels: 11,
  total_panels: 13,
  new_offers: 3,
  unread_messages: 2,
  draft_step: null,
  total_steps: null,
  updated_at: new Date(2026, 7, 28).toISOString(),
  rejection_reason: null,
  sold_at: null,
  sold_price: null,
  buyer_name: null,
}

describe('мои объявления', () => {
  it('опубликованному показывает торг, а не характеристики', () => {
    const row = toMyListingRow(base)
    expect(row.meta).toBe(
      '4\u202F020\u202F000 ₽ · 180\u202F000 км · 3 новых предложения · 2 непрочитанных сообщения',
    )
    expect(row.actions.map((action) => action.id)).toEqual(['open', 'offers'])
    expect(row.tone).toBe('ok')
  })

  it('черновику считает шаги, а не цену', () => {
    const row = toMyListingRow({ ...base, status: 'draft', draft_step: 3, total_steps: 6 })
    expect(row.meta).toBe('Заполнено 3 шага из 6')
    expect(row.actions[0]).toMatchObject({ id: 'continue', primary: true })
  })

  it('причину отказа выносит в строку, а не прячет за кнопкой', () => {
    const row = toMyListingRow({
      ...base,
      status: 'rejected',
      rejection_reason: 'на фотографиях виден номер',
    })
    expect(row.reason).toBe('на фотографиях виден номер')
    expect(row.actions[0].id).toBe('fix')
  })

  it('проданное приглушает и называет покупателя', () => {
    const row = toMyListingRow({
      ...base,
      status: 'sold',
      sold_price: 1800000,
      buyer_name: 'Ольга',
    })
    expect(row.meta).toBe('Продано за 1\u202F800\u202F000 ₽ · покупатель Ольга')
    expect(row.faded).toBe(true)
  })

  it('вкладки считают и фильтруют по состоянию', () => {
    const items = [base, { ...base, id: 'l2', status: 'draft' as const }]
    expect(countByStatus(items, 'all')).toBe(2)
    expect(countByStatus(items, 'draft')).toBe(1)
    expect(filterByStatus(items, 'draft').map((item) => item.id)).toEqual(['l2'])
  })
})
