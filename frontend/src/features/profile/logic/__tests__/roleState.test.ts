import { describe, expect, it } from 'vitest'
import { toProfileWire } from '../fromUser'
import type { RoleRequestWire, UserWire } from '../../../../shared/api/backend/accountContract'

const user = {
  id: 'u1',
  tg_id: null,
  vk_id: null,
  yandex_id: 'y1',
  device_id: null,
  tg_json: null,
  vk_json: null,
  yandex_json: { real_name: 'Игорь' },
  is_guest: false,
  role: 'user',
  created_at: new Date(2026, 2, 14).toISOString(),
  updated_at: null,
} as unknown as UserWire

const listings = { total: 2, rejected: 0 }

function request(status: string, role = 'importer'): RoleRequestWire {
  return {
    id: `rq-${status}`,
    user_id: 'u1',
    requested_role: role as RoleRequestWire['requested_role'],
    reason: 'Вожу машины',
    additional_info: null,
    status: status as RoleRequestWire['status'],
    created_at: new Date(2026, 7, 20).toISOString(),
    updated_at: null,
    reviewed_by: null,
    reviewed_at: null,
    review_comment: null,
  }
}

describe('состояние заявки на роль в профиле', () => {
  it('без заявок профиль зовёт подать', () => {
    expect(toProfileWire(user, listings, []).supplier_status).toBe('none')
  })

  it('живая заявка перевешивает решённые — человек ждёт ответа по ней', () => {
    const wire = toProfileWire(user, listings, [request('rejected'), request('pending')])
    expect(wire.supplier_status).toBe('pending')
    expect(wire.supplier_applied_at).not.toBeNull()
  })

  // Роль уже выдана: состояние читается по самой роли, а не по журналу заявок, где
  // одобрение могло и не сохраниться отдельной строкой.
  it('у поставщика состояние берётся из роли', () => {
    expect(toProfileWire({ ...user, role: 'importer' }, listings, []).supplier_status).toBe(
      'approved',
    )
  })

  it('заявки на другую роль профиль поставщика не трогают', () => {
    expect(toProfileWire(user, listings, [request('pending', 'manager')]).supplier_status).toBe(
      'none',
    )
  })
})
