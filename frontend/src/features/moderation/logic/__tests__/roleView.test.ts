import { describe, expect, it } from 'vitest'
import { toRoleApplication } from '../roleView'
import type { RoleRequestListItemWire } from '../../../../shared/api/backend/accountContract'

const request: RoleRequestListItemWire = {
  id: 'rq1',
  user_id: 'u4',
  user_name: 'Игорь',
  requested_role: 'importer',
  reason: 'Вожу машины из Кореи, хочу выставлять позиции сам.',
  additional_info: 'Работаю с 2019 года, есть свой перевозчик.',
  status: 'pending',
  created_at: new Date(2026, 7, 22).toISOString(),
  updated_at: null,
  reviewed_by: null,
  reviewed_at: null,
  review_comment: null,
}

describe('заявка на роль', () => {
  it('называет роль словами, а не значением с провода', () => {
    expect(toRoleApplication(request).role).toBe('поставщик под привоз')
  })

  it('строка под именем говорит дату и состояние заявки', () => {
    expect(toRoleApplication(request).meta).toBe('заявка от 22 августа · на рассмотрении')
  })

  // Имя приходит не всегда: провайдер входа может его не отдать.
  it('без имени заявитель не остаётся безымянной строкой', () => {
    expect(toRoleApplication({ ...request, user_name: null }).name).toBe('Без имени')
  })

  // Разобранная заявка решается один раз: второе решение сервер отвергает.
  it('решённая заявка помечена как решённая', () => {
    expect(toRoleApplication({ ...request, status: 'approved' }).answered).toBe(true)
    expect(toRoleApplication(request).answered).toBe(false)
  })
})
