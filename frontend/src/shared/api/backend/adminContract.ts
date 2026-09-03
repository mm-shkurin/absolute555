// Консоль — контракт истории 23, `ProductSpecification/api-specs/admin_console.yaml`.
//
// Имена полей оставлены такими, какими они приходят с провода: переименование прячет
// расхождение до первого запроса в прод.
import type { Role } from '../../session/authSession'

/** Что сделали с учётной записью. Три действия, а не свободный текст: журнал читают,
 *  чтобы ответить «на каком основании», и строка без словаря на это не отвечает. */
export type AuditAction = 'role_changed' | 'blocked' | 'unblocked'

export interface UserSummaryWire {
  id: string
  role: Role
  is_verified: boolean
  is_blocked: boolean
  created_at: string
  name: string | null
  /** Чем человек вошёл — `yandex` или `vk`. */
  platform: string | null
}

export interface UserPageWire {
  items: UserSummaryWire[]
  total: number
  page: number
  page_size: number
}

export interface UserCardWire extends UserSummaryWire {
  blocked_reason: string | null
  blocked_at: string | null
  listings_total: number
  complaints_total: number
}

export interface UserAccessWire {
  id: string
  is_blocked: boolean
  blocked_reason: string | null
  blocked_at: string | null
}

export interface AuditEntryWire {
  id: string
  action: AuditAction
  actor_id: string
  actor_name: string | null
  reason: string
  /** Для смены роли — из какой в какую. */
  details: string | null
  created_at: string
}

export interface PeopleQuery {
  query?: string
  role?: Role
  blocked?: boolean
  page?: number
  page_size?: number
}
