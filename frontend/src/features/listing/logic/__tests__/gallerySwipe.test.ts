import { describe, expect, it } from 'vitest'
import { nextIndex, swipeStep, SWIPE_THRESHOLD } from '../gallerySwipe'

describe('листание галереи', () => {
  it('ходит по кругу в обе стороны', () => {
    expect(nextIndex(5, 1, 6)).toBe(0)
    expect(nextIndex(0, -1, 6)).toBe(5)
    expect(nextIndex(2, 1, 6)).toBe(3)
  })

  it('не делит на ноль, когда кадров нет', () => {
    expect(nextIndex(0, 1, 0)).toBe(0)
  })

  it('листает влево и вправо по жесту', () => {
    expect(swipeStep(-80, 5)).toBe(1)
    expect(swipeStep(80, 5)).toBe(-1)
  })

  it('не считает листанием дрожание пальца', () => {
    expect(swipeStep(SWIPE_THRESHOLD - 1, 0)).toBe(0)
  })

  // Ради этого правила функция и написана: палец, ведущий страницу вниз по диагонали,
  // иначе перелистывал бы кадры и мешал прокрутке.
  it('уступает вертикальной прокрутке', () => {
    expect(swipeStep(60, 90)).toBe(0)
  })
})
