import { describe, expect, it } from 'vitest'
import { emptyRequestDraft, missingForRequest, toRequestBody } from '../requestDraft'

const filled = {
  ...emptyRequestDraft,
  brandId: 'b1',
  brandName: 'Toyota',
  modelId: 'm1',
  modelName: 'Land Cruiser 300',
  budget: '12000000',
}

describe('черновик заявки на привоз', () => {
  it('требует машину и бюджет — по ним поставщик отвечает ценой', () => {
    expect(missingForRequest(emptyRequestDraft)).toEqual(['марка', 'модель', 'бюджет'])
  })

  it('остальные условия необязательны', () => {
    expect(missingForRequest(filled)).toEqual([])
  })

  it('в запрос уходят идентификаторы справочника, а не написанные названия', () => {
    const body = toRequestBody({ ...filled, yearFrom: '2022', comment: ' белый ' })
    expect(body).toEqual({
      brand_id: 'b1',
      model_id: 'm1',
      year_from: 2022,
      budget_max: 12000000,
      comment: 'белый',
    })
  })

  it('пустое и нечисловое поле не отправляется', () => {
    const body = toRequestBody({ ...filled, yearFrom: 'скоро', comment: '   ' })
    expect(body.year_from).toBeUndefined()
    expect(body.comment).toBeUndefined()
  })
})
