import { describe, expect, it } from 'vitest'
import { emptyRequestDraft, missingForRequest } from '../requestDraft'

describe('черновик заявки на привоз', () => {
  it('требует машину и бюджет — по ним поставщик отвечает ценой', () => {
    expect(missingForRequest(emptyRequestDraft)).toEqual(['марка', 'модель', 'бюджет'])
  })

  it('остальные условия необязательны', () => {
    const draft = { ...emptyRequestDraft, brand: 'Toyota', model: 'LC 300', budget: '12000000' }
    expect(missingForRequest(draft)).toEqual([])
  })
})
