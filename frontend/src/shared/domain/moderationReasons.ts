// Причины отклонения и жалобы одним словарём: их видят два разных экрана — модератор в
// очереди и покупатель в карточке, — а формулировка за одно и то же нарушение должна
// совпадать, иначе продавец получает два разных объяснения одного отказа.
import type { ComplaintReason, RejectionLabel } from '../api/backend/moderationContract'

export interface ReasonOption<T> {
  value: T
  text: string
}

export const REJECTION_REASONS: ReasonOption<RejectionLabel>[] = [
  { value: 'plate_or_face_visible', text: 'Видны номер или лицо' },
  { value: 'photos_of_another_car', text: 'Фото не той машины' },
  { value: 'bait_price', text: 'Цена-приманка' },
  { value: 'too_few_photos', text: 'Мало фотографий' },
  { value: 'contacts_in_description', text: 'Контакты в описании' },
]

export const COMPLAINT_REASONS: ReasonOption<ComplaintReason>[] = [
  { value: 'bait_price', text: 'Цена-приманка' },
  { value: 'photos_of_another_car', text: 'Фото не той машины' },
  { value: 'contacts_in_description', text: 'Контакты в описании' },
  { value: 'sold_already', text: 'Машина уже продана' },
  { value: 'other', text: 'Другое' },
]

export function complaintReasonText(reason: string): string {
  return COMPLAINT_REASONS.find((option) => option.value === reason)?.text ?? reason
}

export function rejectionLabelText(label: string): string {
  return REJECTION_REASONS.find((option) => option.value === label)?.text ?? label
}
