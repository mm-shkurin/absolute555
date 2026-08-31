import { describe, expect, it } from 'vitest'
import {
  COMPLAINT_REASONS,
  REJECTION_REASONS,
  complaintReasonText,
  rejectionLabelText,
} from '../moderationReasons'

describe('причины отклонения и жалобы', () => {
  it('отдаёт коды контракта, а не подписи с экрана', () => {
    expect(REJECTION_REASONS.map((reason) => reason.value)).toEqual([
      'plate_or_face_visible',
      'photos_of_another_car',
      'bait_price',
      'too_few_photos',
      'contacts_in_description',
    ])
    expect(COMPLAINT_REASONS.map((reason) => reason.value)).toEqual([
      'bait_price',
      'photos_of_another_car',
      'contacts_in_description',
      'sold_already',
      'other',
    ])
  })

  it('переводит код в подпись', () => {
    expect(complaintReasonText('sold_already')).toBe('Машина уже продана')
    expect(rejectionLabelText('bait_price')).toBe('Цена-приманка')
  })

  // Незнакомый код приезжает как есть: выдуманная подпись спрятала бы расхождение с
  // сервером до первого разговора с модератором.
  it('незнакомый код показывает как есть', () => {
    expect(complaintReasonText('spam')).toBe('spam')
    expect(rejectionLabelText('nonsense')).toBe('nonsense')
  })
})
