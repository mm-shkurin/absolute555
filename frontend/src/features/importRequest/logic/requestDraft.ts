// Черновик заявки на привоз. Полей ровно столько, сколько принимает контракт истории 18:
// марка и модель из справочника, год от, бюджет и слово от себя.
//
// Страны, пробег и «готов ждать» из мокапа сюда не входят: сервер их не принимает, и
// собранное в этих полях никто бы не сохранил.
import type { BuyerRequestCreate } from '../../../shared/api/backend/requestContract'

export interface RequestDraft {
  brandId: string
  brandName: string
  modelId: string
  modelName: string
  yearFrom: string
  budget: string
  comment: string
}

export const emptyRequestDraft: RequestDraft = {
  brandId: '',
  brandName: '',
  modelId: '',
  modelName: '',
  yearFrom: '',
  budget: '',
  comment: '',
}

export function missingForRequest(draft: RequestDraft): string[] {
  const gaps: string[] = []
  if (!draft.brandId) gaps.push('марка')
  if (!draft.modelId) gaps.push('модель')
  // Бюджет обязателен: заявка без него собирает отклики с любой ценой, и покупатель
  // разбирает их вручную вместо поставщиков.
  if (!draft.budget.trim()) gaps.push('бюджет')
  return gaps
}

export function toRequestBody(draft: RequestDraft): BuyerRequestCreate {
  const body: BuyerRequestCreate = { brand_id: draft.brandId, model_id: draft.modelId }
  const year = Number(draft.yearFrom.trim())
  const budget = Number(draft.budget.trim())
  if (draft.yearFrom.trim() && Number.isFinite(year)) body.year_from = year
  if (draft.budget.trim() && Number.isFinite(budget)) body.budget_max = budget
  if (draft.comment.trim()) body.comment = draft.comment.trim()
  return body
}
