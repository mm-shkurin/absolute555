// Причины отклонения и жалобы одним словарём: их видят два разных экрана — модератор в
// очереди и покупатель в карточке, — а формулировка за одно и то же нарушение должна
// совпадать, иначе продавец получает два разных объяснения одного отказа.
import type { ComplaintReason, RejectionLabel } from '../api/backend/moderationContract'
import { COMPLAINT_REASON_CODES, REJECTION_LABELS } from '../domain/moderationReasons'

export interface ReasonOption<T> {
  value: T
  text: string
}

const REASON_TEXT: Record<RejectionLabel | ComplaintReason, string> = {
  plate_or_face_visible: 'Видны номер или лицо',
  photos_of_another_car: 'Фото не той машины',
  bait_price: 'Цена-приманка',
  too_few_photos: 'Мало фотографий',
  contacts_in_description: 'Контакты в описании',
  sold_already: 'Машина уже продана',
  other: 'Другое',
}

function toOption<T extends RejectionLabel | ComplaintReason>(value: T): ReasonOption<T> {
  return { value, text: REASON_TEXT[value] }
}

export const REJECTION_REASONS: ReasonOption<RejectionLabel>[] = REJECTION_LABELS.map(toOption)

export const COMPLAINT_REASONS: ReasonOption<ComplaintReason>[] =
  COMPLAINT_REASON_CODES.map(toOption)

export function complaintReasonText(reason: string): string {
  return COMPLAINT_REASONS.find((option) => option.value === reason)?.text ?? reason
}

export function rejectionLabelText(label: string): string {
  return REJECTION_REASONS.find((option) => option.value === label)?.text ?? label
}
