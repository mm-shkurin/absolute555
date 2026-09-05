// Заявка на роль глазами модератора. Заявка отвечает на один вопрос — «пустите меня» —
// и ровно это в ней и есть: какая роль, зачем и что человек добавил от себя. Условия
// поставки (страны, марки, сроки, предоплата) — профиль поставщика, история 16: их
// заполняют после одобрения, и в заявке их нет ни на сервере, ни на экране.
import { dayAndMonth } from '../../../shared/format/dates'
import type { RoleRequestListItemWire } from '../../../shared/api/backend/accountContract'
import type { UserRole } from '../../../shared/api/backend/accountContract'

export interface RoleApplicationView {
  id: string
  name: string
  meta: string
  role: string
  reason: string
  about: string | null
  answered: boolean
}


const ROLE: Record<UserRole, string> = {
  guest: 'гость',
  user: 'пользователь',
  importer: 'поставщик под привоз',
  manager: 'модератор',
  admin: 'администратор',
}

const STATUS: Record<string, string> = {
  pending: 'на рассмотрении',
  approved: 'одобрена',
  rejected: 'отклонена',
}

export function toRoleApplication(wire: RoleRequestListItemWire): RoleApplicationView {
  return {
    id: wire.id,
    // Имени может не быть: человек входил через провайдера, который его не отдал.
    name: wire.user_name ?? 'Без имени',
    meta: [`заявка от ${dayAndMonth(wire.created_at)}`, STATUS[wire.status]].join(' · '),
    role: ROLE[wire.requested_role] ?? wire.requested_role,
    reason: wire.reason,
    about: wire.additional_info,
    answered: wire.status !== 'pending',
  }
}
