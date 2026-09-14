import type {
  SupplierProfileWire,
  SupplierStatus,
} from '../../../shared/api/backend/supplierContract'

/** Статус, по которому читается экран: у опубликованной витрины с правкой — статус правки. */
export function shownStatus(profile: SupplierProfileWire | null): SupplierStatus {
  return profile?.revision_status ?? profile?.status ?? 'draft'
}

/** В очереди профиль заморожен. Экран это показывает сам, а не отправляет запрос
 *  вслепую и объясняет отказом. */
export function isEditable(status: SupplierStatus): boolean {
  return status !== 'pending'
}
