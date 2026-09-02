// Что означает статус профиля и что в нём можно делать.
import { isHttpError } from '../../../shared/api/httpClient'
import { failureText } from '../../../shared/api/failureText'
import type { SupplierStatus } from '../../../shared/api/backend/supplierContract'

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
  if (isHttpError(error) && error.errorCode === 'PROFILE_INCOMPLETE') {
    const missing = error.details?.missing_fields
    const named = Array.isArray(missing)
      ? missing.map((field) => FIELD_LABEL[String(field)] ?? String(field))
      : []
    if (named.length > 0) return `Не хватает: ${named.join(', ')}.`
  }
  if (isHttpError(error) && error.errorCode === 'PROFILE_FROZEN') {
    return 'Профиль уже в очереди — дождитесь решения модератора.'
  }
  return failureText(error)
}
