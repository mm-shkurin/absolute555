// Черновик объявления: поля, происхождение каждого значения и сводка перед отправкой.
import { formatAmount } from '../../../shared/format/money'

import type { ListingKind } from '../../../shared/api/backend/saleCarContract'
import type { FieldSource } from '../../../shared/ui/fieldSource'

export type { FieldSource }

export interface DraftField {
  value: string
  source: FieldSource
}

export interface Draft {
  /** Канал поставки. Выбран при создании черновика и здесь только читается: сменить
   *  его нельзя, а от него зависит, какие поля обязательны. */
  kind: ListingKind
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
  /** Только у привоза: откуда везут, за сколько дней и почём под ключ. */
  importCountry: string
  deliveryDays: string
  turnkeyPrice: string
}

const manual = (value = ''): DraftField => ({ value, source: 'manual' })

export const EMPTY_DRAFT: Draft = {
  kind: 'stock',
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
  importCountry: '',
  deliveryDays: '',
  turnkeyPrice: '',
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
    ...(draft.kind === 'import' ? importRows(draft) : []),
  ]
}

function importRows(draft: Draft): SummaryRow[] {
  return [
    { label: 'Откуда везут', value: draft.importCountry || '—', warn: !draft.importCountry },
    {
      label: 'Срок доставки',
      value: draft.deliveryDays ? `${draft.deliveryDays} дней` : '—',
      warn: !draft.deliveryDays,
    },
    {
      label: 'Цена под ключ',
      value: draft.turnkeyPrice ? `${formatAmount(Number(draft.turnkeyPrice))} ₽` : '—',
      warn: !draft.turnkeyPrice,
    },
  ]
}

// Чего не хватает для отправки. Список, а не булево: человеку нужно знать, что именно
// дописать, а «кнопка неактивна» этого не говорит.
export function missingForSubmit(draft: Draft): string[] {
  const gaps: string[] = []
  const importing = draft.kind === 'import'
  if (!draft.brand.value || !draft.model.value) gaps.push('марка и модель')
  if (!draft.year.value) gaps.push('год выпуска')
  if (!draft.price) gaps.push('цена')
  // У машины, которой в стране ещё нет, пробега не бывает — как и VIN до растаможки.
  if (!importing && !draft.mileage) gaps.push('пробег')
  if (!draft.phone) gaps.push('телефон')
  if (draft.photosCount === 0) gaps.push('хотя бы одна фотография')
  if (importing) {
    if (!draft.importCountry) gaps.push('страна, откуда везут')
    if (!draft.deliveryDays) gaps.push('срок доставки')
    if (!draft.turnkeyPrice) gaps.push('цена под ключ')
  }
  return gaps
}
