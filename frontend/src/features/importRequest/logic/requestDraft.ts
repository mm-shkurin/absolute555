// Черновик заявки на привоз. Обязательного минимума ровно столько, сколько нужно
// поставщику, чтобы ответить ценой: что за машина и сколько покупатель готов отдать.
export interface RequestDraft {
  brand: string
  model: string
  yearFrom: string
  yearTo: string
  budget: string
  mileage: string
  country: string
  wait: string
  comment: string
}

export const COUNTRIES = ['Любая страна', 'Япония', 'Корея', 'ОАЭ', 'Китай']
export const WAIT_OPTIONS = ['до 60 дней', 'до 90 дней', 'до 120 дней', 'сколько потребуется']

export const emptyRequestDraft: RequestDraft = {
  brand: '',
  model: '',
  yearFrom: '',
  yearTo: '',
  budget: '',
  mileage: '',
  country: '',
  wait: '',
  comment: '',
}

export function missingForRequest(draft: RequestDraft): string[] {
  const gaps: string[] = []
  if (!draft.brand) gaps.push('марка')
  if (!draft.model) gaps.push('модель')
  // Бюджет обязателен: заявка без него собирает отклики с любой ценой, и покупатель
  // разбирает их вручную вместо поставщиков.
  if (!draft.budget) gaps.push('бюджет')
  return gaps
}
