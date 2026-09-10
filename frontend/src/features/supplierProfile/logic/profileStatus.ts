// Что означает статус профиля и что в нём можно делать.
import { httpErrorIn } from '../../../shared/api/httpClient'
import { failureText } from '../../../shared/api/failureText'
import type {
  SupplierProfileWire,
  SupplierStatus,
} from '../../../shared/api/backend/supplierContract'

export const STATUS_WORD: Record<SupplierStatus, string> = {
  draft: 'черновик',
  pending: 'на проверке',
  published: 'опубликован',
  rejected: 'отклонён',
}

export const STATUS_NOTE: Record<SupplierStatus, string> = {
  draft: 'Заполните профиль и отправьте на проверку — до этого его никто не видит.',
  pending: 'Профиль у модератора. Пока он в очереди, править его нельзя.',
  published: 'Профиль виден покупателям. Правка снова отправит его на проверку.',
  rejected: 'Модератор вернул профиль. Исправьте названное и отправьте снова.',
}

/** Статус, по которому читается экран: у опубликованной витрины с правкой — статус правки. */
export function shownStatus(profile: SupplierProfileWire | null): SupplierStatus {
  return profile?.revision_status ?? profile?.status ?? 'draft'
}

/** В очереди профиль заморожен. Экран это показывает сам, а не отправляет запрос
 *  вслепую и объясняет отказом. */
export function isEditable(status: SupplierStatus): boolean {
  return status !== 'pending'
}

const FIELD_LABEL: Record<string, string> = {
  company_name: 'название',
  countries: 'страны',
  brands: 'марки',
  delivery_days_min: 'срок доставки от',
  delivery_days_max: 'срок доставки до',
  terms: 'условия',
  description: 'описание',
}

export function profileFailureText(error: unknown): string {
  // Отказ лежит в `cause`: `send` заворачивает его, и верхний объект кода не несёт.
  const failure = httpErrorIn(error)
  if (failure?.errorCode === 'PROFILE_INCOMPLETE') {
    const missing = failure.details?.missing_fields
    const named = Array.isArray(missing)
      ? missing.map((field) => FIELD_LABEL[String(field)] ?? String(field))
      : []
    if (named.length > 0) return `Не хватает: ${named.join(', ')}.`
  }
  if (failure?.errorCode === 'PROFILE_FROZEN') {
    return 'Профиль уже в очереди — дождитесь решения модератора.'
  }
  return failureText(error)
}
