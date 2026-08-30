import { describe, expect, it } from 'vitest'
import { toRoleApplication } from '../roleView'
import type { RoleApplicationWire } from '../../api/moderationApi'

const wire: RoleApplicationWire = {
  id: 'a1',
  applicant_name: 'Дмитрий Ким',
  company_name: 'Восток-Авто',
  applied_at: new Date(2026, 7, 24).toISOString(),
  member_since: 'июня',
  buyer_rating: 4.9,
  account_age_days: 80,
  countries: ['Япония', 'Корея'],
  brands: ['Toyota', 'Lexus', 'Honda'],
  delivery_days: '45–70 дней',
  prepayment_percent: 30,
  phone_masked: '+7 913 ***-**-21',
  claimed_deliveries: 40,
  about: 'Вожу с аукционов Японии пятый год.',
}

describe('заявки на роль поставщика', () => {
  it('называет компанию и человека вместе', () => {
    expect(toRoleApplication(wire).name).toBe('Восток-Авто · Дмитрий Ким')
    expect(toRoleApplication({ ...wire, company_name: null }).name).toBe('Дмитрий Ким')
  })

  it('старый аккаунт описан сроком на площадке', () => {
    const view = toRoleApplication(wire)
    expect(view.fresh).toBe(false)
    expect(view.meta).toBe('заявка от 24 августа · на площадке с июня · рейтинг покупателя 4,9')
  })

  it('свежий аккаунт назван словами, а не спрятан в дату', () => {
    const view = toRoleApplication({ ...wire, account_age_days: 2 })
    expect(view.fresh).toBe(true)
    expect(view.meta).toContain('аккаунт создан 2 дня назад')
  })

  it('обещанные поставки помечены как слова заявителя', () => {
    const terms = toRoleApplication(wire).terms
    expect(terms.find((term) => term.label === 'Привёз за год')?.value).toBe(
      'по его словам — 40 машин',
    )
    expect(
      toRoleApplication({ ...wire, claimed_deliveries: null }).terms.find(
        (term) => term.label === 'Привёз за год',
      )?.value,
    ).toBe('не сказал')
  })
})
