// Анкета поставщика. Обязательны те поля, по которым покупатель будет его выбирать: без
// стран, срока и предоплаты страница поставщика оказалась бы пустой витриной.
export interface SupplierDraft {
  name: string
  countries: string
  brands: string
  deliveryDays: string
  prepayment: string
  phone: string
  contactMode: string
  about: string
}

export const CONTACT_MODES = ['Телефон и чат', 'Только чат']

export const emptySupplierDraft: SupplierDraft = {
  name: '',
  countries: '',
  brands: '',
  deliveryDays: '',
  prepayment: '',
  phone: '',
  contactMode: CONTACT_MODES[0],
  about: '',
}

export function missingForSupplier(draft: SupplierDraft): string[] {
  const gaps: string[] = []
  if (!draft.name) gaps.push('название')
  if (!draft.countries) gaps.push('страны')
  if (!draft.deliveryDays) gaps.push('срок доставки')
  if (!draft.prepayment) gaps.push('условия предоплаты')
  if (!draft.phone) gaps.push('телефон')
  // Рассказ о себе — единственное, на чём владелец основывает решение: проверять документы
  // площадка не берётся, значит анкета без текста не рассматривается вовсе.
  if (draft.about.trim().length < 40) gaps.push('рассказ об опыте')
  return gaps
}
