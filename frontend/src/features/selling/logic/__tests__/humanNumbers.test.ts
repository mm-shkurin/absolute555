import { describe, expect, it } from 'vitest'
import { EMPTY_DRAFT, summaryRows } from '../draft'
import { toPatch } from '../draftWire'

const NBSP = String.fromCharCode(160)

// Feature: Цена и пробег принимаются в том виде, в каком их пишут
describe('ввод чисел в мастере продажи', () => {
  // Scenario Outline: Цена сохраняется, введённая как в подсказке
  it.each([
    ['4 020 000', 4020000],
    ['4020000', 4020000],
    [`4${NBSP}020${NBSP}000`, 4020000],
    [' 1 390 000 ', 1390000],
  ])('Scenario: цена «%s» сохраняется как %i', (typed, stored) => {
    // Given продавец на шаге цены
    // When вводит цену так, как показано в подсказке
    const patch = toPatch({ ...EMPTY_DRAFT, price: typed })
    // Then на сервер уходит число
    expect(patch.price).toBe(stored)
  })

  it('Scenario: пробег «180 000» и цена под ключ «6 690 000» не теряются', () => {
    const patch = toPatch({
      ...EMPTY_DRAFT,
      kind: 'import',
      mileage: '180 000',
      turnkeyPrice: '6 690 000',
    })

    expect(patch.milleage).toBe(180000)
    expect(patch.turnkey_price).toBe(6690000)
  })

  it('Scenario: сводка перед отправкой показывает цену, введённую с пробелами', () => {
    // Given продавец ввёл цену «4 020 000»
    // When открывает шаг отправки
    const rows = summaryRows({ ...EMPTY_DRAFT, price: '4 020 000' })
    // Then в сводке сумма, а не «NaN»
    expect(rows.find((row) => row.label === 'Цена')?.value).not.toContain('NaN')
  })

  it('нечисло по-прежнему не уходит на сервер', () => {
    expect(toPatch({ ...EMPTY_DRAFT, mileage: 'сто тысяч' }).milleage).toBeUndefined()
  })
})
