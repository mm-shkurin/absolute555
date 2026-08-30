// Черновик объявления: поля, происхождение каждого значения и сводка перед отправкой.
import { formatAmount } from '../../../shared/format/money'

import type { FieldSource } from '../../../shared/ui/fieldSource'

export type { FieldSource }

export interface DraftField {
  value: string
  source: FieldSource
}

export interface Draft {
  brand: DraftField
  model: DraftField
  year: DraftField
  transmission: DraftField
  enginePower: DraftField
  vin: DraftField
  price: string
  mileage: string
  city: string
  phone: string
  description: string
  showPhone: boolean
  photosCount: number
  measuredPanels: number
  totalPanels: number
}

const manual = (value = ''): DraftField => ({ value, source: 'manual' })

export const EMPTY_DRAFT: Draft = {
  brand: manual(),
  model: manual(),
  year: manual(),
  transmission: manual(),
  enginePower: manual(),
  vin: manual(),
  price: '',
  mileage: '',
  city: '',
  phone: '',
  description: '',
  showPhone: false,
  photosCount: 0,
  measuredPanels: 0,
  totalPanels: 13,
}

export const MAX_PHOTOS = 15

export interface SummaryRow {
  label: string
  value: string
  warn?: boolean
}

export function summaryRows(draft: Draft): SummaryRow[] {
  const complete = draft.measuredPanels === draft.totalPanels
  return [
    { label: 'Марка и модель', value: `${draft.brand.value} ${draft.model.value}`.trim() || '—' },
    { label: 'Год', value: draft.year.value || '—' },
    { label: 'Цена', value: draft.price ? `${formatAmount(Number(draft.price))} ₽` : '—' },
    { label: 'Пробег', value: draft.mileage ? `${formatAmount(Number(draft.mileage))} км` : '—' },
    { label: 'Коробка', value: draft.transmission.value || '—' },
    { label: 'Мощность', value: draft.enginePower.value ? `${draft.enginePower.value} л.с.` : '—' },
    { label: 'Фотографии', value: `${draft.photosCount} из ${MAX_PHOTOS}` },
    {
      label: 'Карта замеров',
      value: `${draft.measuredPanels} из ${draft.totalPanels} панелей`,
      warn: !complete,
    },
    { label: 'Телефон в карточке', value: draft.showPhone ? 'показан' : 'скрыт' },
    { label: 'Город', value: draft.city || '—' },
  ]
}

// Чего не хватает для отправки. Список, а не булево: человеку нужно знать, что именно
// дописать, а «кнопка неактивна» этого не говорит.
export function missingForSubmit(draft: Draft): string[] {
  const gaps: string[] = []
  if (!draft.brand.value || !draft.model.value) gaps.push('марка и модель')
  if (!draft.year.value) gaps.push('год выпуска')
  if (!draft.price) gaps.push('цена')
  if (!draft.mileage) gaps.push('пробег')
  if (!draft.phone) gaps.push('телефон')
  if (draft.photosCount === 0) gaps.push('хотя бы одна фотография')
  return gaps
}
