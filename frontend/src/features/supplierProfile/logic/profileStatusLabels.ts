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
