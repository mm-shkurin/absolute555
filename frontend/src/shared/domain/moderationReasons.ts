import type { ComplaintReason, RejectionLabel } from '../api/backend/moderationContract'

export const REJECTION_LABELS: RejectionLabel[] = [
  'plate_or_face_visible',
  'photos_of_another_car',
  'bait_price',
  'too_few_photos',
  'contacts_in_description',
]

export const COMPLAINT_REASON_CODES: ComplaintReason[] = [
  'bait_price',
  'photos_of_another_car',
  'contacts_in_description',
  'sold_already',
  'other',
]
