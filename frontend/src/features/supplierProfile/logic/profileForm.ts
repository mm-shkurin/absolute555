// Профиль поставщика: то, что человек правит на экране, и перевод этого в правку провода.
import type {
  SupplierProfileUpdate,
  SupplierProfileWire,
} from '../../../shared/api/backend/supplierContract'

export interface ProfileForm {
  companyName: string
  /** Списки правятся строкой через запятую: их два, они короткие, и отдельный редактор
   *  тегов ради двух полей — это экран вместо поля. */
  countries: string
  brands: string
  daysMin: string
  daysMax: string
  terms: string
  description: string
}

export const EMPTY_FORM: ProfileForm = {
  companyName: '',
  countries: '',
  brands: '',
  daysMin: '',
  daysMax: '',
  terms: '',
  description: '',
}

const list = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

export function toForm(wire: SupplierProfileWire): ProfileForm {
  return {
    companyName: wire.company_name ?? '',
    countries: wire.countries.join(', '),
    brands: wire.brands.join(', '),
    daysMin: wire.delivery_days_min === null ? '' : String(wire.delivery_days_min),
    daysMax: wire.delivery_days_max === null ? '' : String(wire.delivery_days_max),
    terms: wire.terms ?? '',
    description: wire.description ?? '',
  }
}

export function toUpdate(form: ProfileForm): SupplierProfileUpdate {
  const update: SupplierProfileUpdate = {
    countries: list(form.countries),
    brands: list(form.brands),
  }
  if (form.companyName.trim()) update.company_name = form.companyName.trim()
  if (form.terms.trim()) update.terms = form.terms.trim()
  if (form.description.trim()) update.description = form.description.trim()
  // Нечисло в поле срока на сервер не уходит: он отверг бы весь запрос, и человек
  // потерял бы остальные правки из-за одной опечатки.
  const min = Number(form.daysMin.trim())
  const max = Number(form.daysMax.trim())
  if (form.daysMin.trim() && Number.isFinite(min)) update.delivery_days_min = min
  if (form.daysMax.trim() && Number.isFinite(max)) update.delivery_days_max = max
  return update
}

/** Чего не хватает для отправки в очередь. Список, а не булево: «кнопка неактивна»
 *  не говорит, что дописать. Итог всё равно решает сервер — он же и отвечает 422. */
export function missingForSubmit(form: ProfileForm): string[] {
  const gaps: string[] = []
  if (!form.companyName.trim()) gaps.push('название')
  if (list(form.countries).length === 0) gaps.push('страны')
  if (list(form.brands).length === 0) gaps.push('марки')
  if (!form.daysMin.trim() || !form.daysMax.trim()) gaps.push('срок доставки')
  if (!form.terms.trim()) gaps.push('условия')
  return gaps
}
