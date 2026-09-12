import { describe, expect, it } from 'vitest'
import { resumeStep } from '../wizardSteps'

describe('с какого шага продолжать черновик', () => {
  const blank = { value: '' }
  const base = {
    brand: blank,
    model: blank,
    year: blank,
    price: '',
    mileage: '',
    photosCount: 0,
  }

  it('пустой черновик — с фото документа', () => {
    expect(resumeStep(base)).toBe('document')
  })

  it('марка без года — к характеристикам, а не снова к документу', () => {
    expect(resumeStep({ ...base, brand: { value: 'Jeep' } })).toBe('specs')
  })

  it('характеристики заполнены — к цене, затем к фото, затем к карте', () => {
    const specs = {
      ...base,
      brand: { value: 'Jeep' },
      model: { value: 'Cherokee' },
      year: { value: '1992' },
      mileage: '200000',
    }
    expect(resumeStep(specs)).toBe('pricing')
    expect(resumeStep({ ...specs, price: '500000' })).toBe('photos')
    expect(resumeStep({ ...specs, price: '500000', photosCount: 3 })).toBe('thickness')
  })
})
