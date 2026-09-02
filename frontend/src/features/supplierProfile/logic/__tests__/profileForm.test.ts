import { describe, expect, it } from 'vitest'
import { EMPTY_FORM, missingForSubmit, toForm, toUpdate } from '../profileForm'
import { isEditable, profileFailureText } from '../profileStatus'
import type { SupplierProfileWire } from '../../../../shared/api/backend/supplierContract'

const wire: SupplierProfileWire = {
  user_id: 'u1',
  company_name: 'Восток-Авто',
  countries: ['Япония', 'Корея'],
  brands: ['Toyota'],
  delivery_days_min: 45,
  delivery_days_max: 70,
  terms: 'Предоплата 30%',
  description: null,
  status: 'draft',
  reject_reason: null,
  updated_at: null,
}

describe('форма профиля поставщика', () => {
  it('списки правятся строкой и уезжают массивом', () => {
    const form = toForm(wire)
    expect(form.countries).toBe('Япония, Корея')
    expect(toUpdate({ ...form, countries: 'Япония,  Корея ,' }).countries).toEqual([
      'Япония',
      'Корея',
    ])
  })

  it('пустое поле не отправляется, а нечисло в сроке — тем более', () => {
    const update = toUpdate({ ...EMPTY_FORM, daysMin: 'скоро', daysMax: '70' })
    expect(update.company_name).toBeUndefined()
    expect(update.delivery_days_min).toBeUndefined()
    expect(update.delivery_days_max).toBe(70)
  })

  it('называет, чего не хватает для отправки в очередь', () => {
    expect(missingForSubmit(EMPTY_FORM)).toEqual([
      'название',
      'страны',
      'марки',
      'срок доставки',
      'условия',
    ])
    expect(missingForSubmit(toForm(wire))).toEqual([])
  })

  it('профиль в очереди не правится: это состояние, а не отказ сервера', () => {
    expect(isEditable('pending')).toBe(false)
    expect(isEditable('rejected')).toBe(true)
    expect(isEditable('published')).toBe(true)
  })
})

function refusal(code: string, details?: Record<string, unknown>) {
  const error = new Error('refused') as Error & {
    status: number
    errorCode: string
    details?: Record<string, unknown>
  }
  error.status = 422
  error.errorCode = code
  error.details = details
  return error
}

describe('отказы профиля', () => {
  it('незаполненные поля называет по-русски', () => {
    expect(
      profileFailureText(refusal('PROFILE_INCOMPLETE', { missing_fields: ['countries', 'terms'] })),
    ).toBe('Не хватает: страны, условия.')
  })

  it('замороженный профиль объясняет, почему правка не прошла', () => {
    expect(profileFailureText(refusal('PROFILE_FROZEN'))).toContain('дождитесь решения')
  })
})
