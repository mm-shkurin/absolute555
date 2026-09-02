import { describe, expect, it } from 'vitest'
import { sellerLine, toReviewView } from '../sellerView'
import type { ReviewWire, SellerProfileWire } from '../../api/sellerApi'

const seller: SellerProfileWire = {
  user_id: 'u1',
  name: 'Михаил',
  avatar_url: null,
  rating: 4.8,
  reviews_count: 9,
  deals_count: 12,
  listings_count: 3,
  member_since: new Date(2026, 2, 14).toISOString(),
}

const review: ReviewWire = {
  review_id: 'rev1',
  offer_id: 'o1',
  sale_car_id: 'l1',
  seller_id: 'u1',
  author: { user_id: 'u7', name: 'Ольга', avatar_url: null },
  rating: 5,
  text: 'Карта замеров оказалась честной.',
  created_at: new Date(2026, 7, 22).toISOString(),
  updated_at: null,
  editable_until: null,
}

describe('профиль продавца', () => {
  it('строка под именем собирается из оценки, сделок и срока', () => {
    expect(sellerLine(seller)).toBe('4,8 · 12 сделок · на площадке с март 2026 г.')
  })

  // Сделки и отзывы — разные числа: сделка бывает без отзыва, и строка называет сделки.
  it('без отзывов оценки нет, а сделки остаются', () => {
    expect(sellerLine({ ...seller, rating: null, reviews_count: 0 })).toContain('12 сделок')
    expect(sellerLine({ ...seller, rating: null, reviews_count: 0 })).not.toContain('0,0')
  })

  it('отзыв без имени автора не выдумывает его', () => {
    expect(toReviewView({ ...review, author: null }).author).toBe('Покупатель')
  })

  it('пустой текст отзыва остаётся пустым', () => {
    expect(toReviewView({ ...review, text: null }).body).toBe('')
  })
})
