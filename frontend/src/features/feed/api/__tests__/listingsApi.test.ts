import { describe, expect, it } from 'vitest'
import { hasMorePages } from '../listingsApi'

describe('низ ленты', () => {
  it('пока показано меньше, чем сервер насчитал, есть что грузить', () => {
    expect(hasMorePages(20, 27)).toBe(true)
  })

  it('полная последняя страница низом и остаётся', () => {
    // Считать по «пришла полная страница» нельзя: ровно двадцать из двадцати выглядели
    // бы как непоследняя страница, и кнопка вела бы в пустоту.
    expect(hasMorePages(20, 20)).toBe(false)
  })

  it('пустая выдача кнопки не показывает', () => {
    expect(hasMorePages(0, 0)).toBe(false)
  })
})
