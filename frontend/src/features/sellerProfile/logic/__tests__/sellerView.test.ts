import { describe, expect, it } from 'vitest'
import { sellerLine, toInvitation, toReviewView } from '../sellerView'
import type { ReviewWire, SellerWire } from '../../api/sellerApi'

const seller: SellerWire = {
  id: 'u1',
  name: 'Михаил',
  rating: 4.8,
  deals_count: 12,
  reviews_count: 9,
  member_since: 'марта 2026',
}

const review: ReviewWire = {
  id: 'rev1',
  author_name: 'Ольга',
  rating: 5,
  created_at: new Date(2026, 7, 22).toISOString(),
  listing_title: 'Mazda CX-5',
  body: 'Карта замеров оказалась честной.',
}

describe('профиль продавца', () => {
  it('строка под именем собирается из оценки, сделок и срока', () => {
    expect(sellerLine(seller)).toBe('4,8 · 12 сделок · на площадке с марта 2026')
  })

  it('отзыв всегда назван машиной, по которой написан', () => {
    expect(toReviewView(review).meta).toBe('· 22 августа · Mazda CX-5')
  })

  it('без принятого предложения форма отзыва не появляется', () => {
    const invitation = toInvitation({
      can_review: false,
      deal_listing_title: null,
      deal_closed_at: null,
      existing_review_id: null,
    })
    expect(invitation.allowed).toBe(false)
    expect(invitation.explanation).toContain('только по принятому предложению')
  })

  it('право на отзыв объясняет, за какую сделку ставится оценка', () => {
    const invitation = toInvitation({
      can_review: true,
      deal_listing_title: 'Mazda CX-5',
      deal_closed_at: new Date(2026, 7, 22).toISOString(),
      existing_review_id: null,
    })
    expect(invitation.allowed).toBe(true)
    expect(invitation.editing).toBe(false)
    expect(invitation.explanation).toBe(
      'Вы купили у этого продавца Mazda CX-5 22 августа. Оценка появится в его профиле и в карточке каждого его объявления.',
    )
  })

  it('существующий отзыв переводит форму в режим правки', () => {
    const invitation = toInvitation({
      can_review: true,
      deal_listing_title: 'Mazda CX-5',
      deal_closed_at: null,
      existing_review_id: 'rev1',
    })
    expect(invitation.editing).toBe(true)
  })
})
