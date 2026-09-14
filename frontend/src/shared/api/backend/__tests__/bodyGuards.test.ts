import { describe, expect, it } from 'vitest'
import { isSaleCarBody, isTokenPairBody } from '../bodyGuards'

describe('isTokenPairBody', () => {
  it('accepts a body with both tokens', () => {
    expect(isTokenPairBody({ access_token: 'a', refresh_token: 'r', token_type: 'bearer' })).toBe(
      true,
    )
  })

  it('rejects a body without the refresh token', () => {
    expect(isTokenPairBody({ access_token: 'a' })).toBe(false)
  })
})

describe('isSaleCarBody', () => {
  it('accepts a listing with a known autofill state', () => {
    expect(isSaleCarBody({ sale_car_id: 'c1', autofill: { state: 'done' } })).toBe(true)
  })

  it('rejects a listing whose autofill state is unknown', () => {
    expect(isSaleCarBody({ sale_car_id: 'c1', autofill: { state: 'finished' } })).toBe(false)
  })
})
