// Заявка на роль глазами модератора. Заявка отвечает на один вопрос — «пустите меня» —
// и ровно это в ней и есть: какая роль, зачем и что человек добавил от себя. Условия
// поставки (страны, марки, сроки, предоплата) — профиль поставщика, история 16: их
// заполняют после одобрения, и в заявке их нет ни на сервере, ни на экране.
import { dayAndMonth } from '../../../shared/format/dates'
import type { RoleRequestListItemWire } from '../../../shared/api/backend/accountContract'
import { APPLICATION_STATUS, ROLE_IN_APPLICATION } from './moderationLabels'

export interface RoleApplicationView {
  id: string
  name: string
  meta: string
  role: string
  reason: string
  about: string | null
  answered: boolean
}

export function toRoleApplication(wire: RoleRequestListItemWire): RoleApplicationView {
  return {
    id: wire.id,
    // Имени может не быть: человек входил через провайдера, который его не отдал.
    name: wire.user_name ?? 'Без имени',
    meta: [`заявка от ${dayAndMonth(wire.created_at)}`, APPLICATION_STATUS[wire.status]].join(
      ' · ',
    ),
    role: ROLE_IN_APPLICATION[wire.requested_role] ?? wire.requested_role,
    reason: wire.reason,
    about: wire.additional_info,
    answered: wire.status !== 'pending',
  }
}
