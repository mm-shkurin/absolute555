import { describe, expect, it } from 'vitest'
import { toQueueRow, toReviewCard } from '../queueView'
import { toComplaintCase } from '../complaintView'
import type { ComplaintCaseWire, QueueItemWire } from '../../api/moderationApi'

const item: QueueItemWire = {
  id: 'q1',
  listing_id: 'l1',
  title: 'Honda Stream',
  year: 2010,
  price: 1020000,
  seller_name: 'Михаил',
  seller_rating: 4.8,
  seller_is_new: false,
  submitted_at: new Date(2026, 7, 28, 14, 32).toISOString(),
  photos_count: 7,
  measured_panels: 11,
  total_panels: 13,
  complaints_count: 0,
  complaint_reason: null,
  is_import: false,
  vin_masked: 'JHMRN18***0231',
  photos_plate_hidden: true,
  phone_hidden: true,
}

describe('очередь модерации', () => {
  it('строка очереди называет продавца, время и полноту карточки', () => {
    const row = toQueueRow(item)
    expect(row.title).toBe('Honda Stream · 2010 · 1\u202F020\u202F000 ₽')
    expect(row.meta).toBe('Михаил · рейтинг 4,8 · отправлено 14:32 · 7 фото · карта 11 из 13')
    expect(row.flag).toBeNull()
    expect(row.badge).toBe('ждёт')
  })

  it('новый продавец назван словами, а не пустым рейтингом', () => {
    const row = toQueueRow({ ...item, seller_is_new: true, seller_rating: null })
    expect(row.meta).toContain('Михаил · новый продавец')
  })

  it('жалобы выносит отдельной строкой и меняет тон', () => {
    const row = toQueueRow({ ...item, complaints_count: 2, complaint_reason: 'цена-приманка' })
    expect(row.flag).toBe('2 жалобы: цена-приманка')
    expect(row.tone).toBe('bad')
    expect(row.badge).toBe('жалобы')
  })

  it('позиция под заказ не притворяется машиной с VIN', () => {
    const card = toReviewCard({ ...item, is_import: true, vin_masked: null, measured_panels: 0 })
    expect(card.facts[0].value).toBe('нет — машина под заказ')
    expect(card.facts[2].value).toBe('не заполнена')
  })
})

const complaintCase: ComplaintCaseWire = {
  listing_id: 'l9',
  title: 'BMW X5',
  year: 2013,
  price: 2450000,
  seller_name: 'Игорь',
  seller_rating: 3.9,
  published_at: new Date(2026, 7, 12).toISOString(),
  complaints: [
    {
      id: 'c1',
      author_name: 'Артём',
      created_at: new Date(2026, 7, 28, 11, 20).toISOString(),
      reason: 'цена-приманка',
      body: 'В объявлении одна цена, в чате другая.',
    },
    {
      id: 'c2',
      author_name: 'Ольга',
      created_at: new Date(2026, 7, 27, 18, 4).toISOString(),
      reason: 'фото не той машины',
      body: 'На снимках разные диски.',
    },
  ],
}

describe('жалобы', () => {
  it('копятся на объявление и считаются вместе', () => {
    const view = toComplaintCase(complaintCase, new Date(2026, 7, 28, 20, 0))
    expect(view.title).toBe('BMW X5 · 2013 · 2\u202F450\u202F000 ₽')
    expect(view.count).toBe('2 жалобы')
    expect(view.complaints[0].meta).toBe('· сегодня, 11:20 · причина: цена-приманка')
    expect(view.complaints[1].meta).toBe('· вчера, 18:04 · причина: фото не той машины')
  })
})
