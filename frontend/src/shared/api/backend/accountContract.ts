// Сессия, профиль и роли — зеркало `backend/app/schemas/token.py`, `user.py`, `role.py`.
export type UserRole = 'user' | 'guest' | 'admin' | 'manager'

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

export interface RoleRequestWire {
  id: string
  user_id: string
  requested_role: UserRole
  reason: string
  additional_info: string | null
  status: string
  created_at: string
  updated_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_comment: string | null
}

/** В списке для модератора полей меньше, но есть имя заявителя. */
export interface RoleRequestListItemWire {
  id: string
  user_id: string
  user_name: string
  requested_role: UserRole
  reason: string
  status: string
  created_at: string
}

export interface RoleRequestDecision {
  status: string
  review_comment?: string
}
