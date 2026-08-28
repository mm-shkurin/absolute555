import { describe, expect, it } from 'vitest'
import { EMPTY_DRAFT, missingForSubmit, summaryRows } from '../draft'
import { isPassed, nextStep, previousStep } from '../wizardSteps'

const filled = {
  ...EMPTY_DRAFT,
  brand: { value: 'Lexus', source: 'vin' as const },
  model: { value: 'LX 570', source: 'vin' as const },
  year: { value: '2012', source: 'vin' as const },
  price: '4020000',
  mileage: '180000',
  phone: '+79130000000',
  photosCount: 7,
  measuredPanels: 11,
}

describe('мастер продажи', () => {
  it('перечисляет незаполненное поимённо, а не гасит кнопку молча', () => {
    expect(missingForSubmit(EMPTY_DRAFT)).toEqual([
      'марка и модель',
      'год выпуска',
      'цена',
      'пробег',
      'телефон',
      'хотя бы одна фотография',
    ])
    expect(missingForSubmit(filled)).toEqual([])
  })

  it('в сводке цена и пробег разбиты по разрядам, а неполная карта помечена', () => {
    const rows = summaryRows(filled)
    expect(rows.find((row) => row.label === 'Цена')?.value).toBe('4\u202F020\u202F000 ₽')
    expect(rows.find((row) => row.label === 'Пробег')?.value).toBe('180\u202F000 км')
    const map = rows.find((row) => row.label === 'Карта замеров')
    expect(map).toMatchObject({ value: '11 из 13 панелей', warn: true })
  })

  it('полная карта в сводке не помечается предупреждением', () => {
    const rows = summaryRows({ ...filled, measuredPanels: 13 })
    expect(rows.find((row) => row.label === 'Карта замеров')?.warn).toBe(false)
  })

  it('навигация упирается в края, а не уходит за них', () => {
    expect(nextStep('document')).toBe('specs')
    expect(previousStep('document')).toBe('document')
    expect(nextStep('review')).toBe('review')
    expect(isPassed('document', 'pricing')).toBe(true)
    expect(isPassed('photos', 'pricing')).toBe(false)
  })
})
