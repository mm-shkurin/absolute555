import { describe, expect, it } from 'vitest'
import { dayAndMonth, hoursAndMinutes, monthAndYear, parseMoment, shortDay } from '../dates'

describe('даты с провода', () => {
  it('читает нормальную дату', () => {
    expect(dayAndMonth('2026-09-03T10:00:00Z')).toBe('3 сентября')
  })

  // Ради этого случая файл и написан: живой сервер отдаёт объявление без момента
  // отправки, и `Intl` на такой дате бросает RangeError, роняя весь экран.
  it.each([null, undefined, '', 'позавчера'])('отвечает пустотой на %p, а не падает', (value) => {
    expect(dayAndMonth(value as string | null)).toBe('')
    expect(hoursAndMinutes(value as string | null)).toBe('')
    expect(monthAndYear(value as string | null)).toBe('')
    expect(shortDay(value as string | null)).toBe('')
  })

  it('говорит вызывающему, что даты нет', () => {
    expect(parseMoment('')).toBeNull()
    expect(parseMoment('2026-09-03T10:00:00Z')).toBeInstanceOf(Date)
  })
})
