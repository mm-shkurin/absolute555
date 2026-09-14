import { describe, expect, it } from 'vitest'
import { currentYear, recentYearHint } from '../yearHints'

describe('yearHints', () => {
  it('follows the calendar year of the given moment', () => {
    const now = new Date(2026, 8, 14)
    expect(currentYear(now)).toBe(2026)
    expect(recentYearHint(now)).toBe('2022')
  })
})
