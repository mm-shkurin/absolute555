// Сессия, профиль и роли — зеркало `backend/app/schemas/token.py`, `user.py`, `role.py`.
// importer — поставщик под привоз: права обычного пользователя плюс профиль поставщика
// (история 13; сам профиль строит история 16).
export type UserRole = 'guest' | 'user' | 'importer' | 'manager' | 'admin'

export interface TokenWire {
  access_token: string
  refresh_token: string
  token_type: string
}

/** Профиль отдаётся как есть из строки пользователя: `*_json` — сырые ответы провайдеров,
 *  и их форму задаёт провайдер, а не мы. */
export interface UserWire {
  id: string
  tg_id: string | null
  vk_id: string | null
  yandex_id: string | null
  device_id: string | null
  tg_json: Record<string, unknown> | null
  yandex_json: Record<string, unknown> | null
  vk_json: Record<string, unknown> | null
  guest_json: Record<string, unknown> | null
  user_type: string
  role: string | null
  is_verified: boolean | null
  is_guest: boolean
  created_at: string | null
  updated_at: string | null
}

export interface UserRoleInfoWire {
  user_id: string
  current_role: string
  is_verified: boolean
}

export interface UserListItemWire {
  id: string
  role: string
  is_verified: boolean
  /** Сервер отдаёт дату строкой, а не датой. */
  created_at: string
  name: string | null
  platform: string | null
}

export interface RoleStatsWire {
  total_users: number
  users_by_role: Record<string, number>
  verified_users: number
  unverified_users: number
}

export interface RoleRequestCreate {
  requested_role: UserRole
  reason: string
  additional_info?: string
}

export type RoleRequestStatus = 'pending' | 'approved' | 'rejected'

export interface RoleRequestWire {
  id: string
  user_id: string
  requested_role: UserRole
  reason: string
  additional_info: string | null
  status: RoleRequestStatus
  created_at: string
  updated_at: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  review_comment: string | null
}

/** Та же заявка, что и своя, плюс имя заявителя: модератор судит о человеке, а не об
 *  идентификаторе. */
export interface RoleRequestListItemWire extends RoleRequestWire {
  user_name: string | null
}

export interface RoleRequestDecision {
  status: 'approved' | 'rejected'
  /** Обязателен при отказе: заявитель должен знать, что исправить. */
  review_comment?: string
}
