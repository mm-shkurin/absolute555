import { describe, expect, it } from 'vitest'
import { submitFailureText } from '../submitFailure'

function refusal(code: string, details?: Record<string, unknown>) {
  const error = new Error('Listing incomplete') as Error & {
    status: number
    errorCode: string
    details?: Record<string, unknown>
  }
  error.status = 422
  error.errorCode = code
  error.details = details
  return error
}

describe('отказ на отправке объявления', () => {
  it('называет незаполненные поля по-русски', () => {
    const text = submitFailureText(
      refusal('LISTING_INCOMPLETE', { missing_fields: ['price', 'photos'] }),
    )
    expect(text).toBe('Не хватает: цена, фотографии.')
  })

  it('поля привоза называет так же, как остальные', () => {
    const text = submitFailureText(
      refusal('LISTING_INCOMPLETE', { missing_fields: ['import_country', 'turnkey_price'] }),
    )
    expect(text).toBe('Не хватает: страна, откуда везут, цена под ключ.')
  })

  it('незнакомое поле показывает как есть, а не прячет', () => {
    const text = submitFailureText(refusal('LISTING_INCOMPLETE', { missing_fields: ['colour'] }))
    expect(text).toBe('Не хватает: colour.')
  })

  it('другой отказ переводит общим правилом', () => {
    expect(submitFailureText(refusal('LISTING_SOLD'))).toContain('продали')
  })
})
