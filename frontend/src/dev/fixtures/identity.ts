// Имя и фотография своего профиля в заглушке — живые.
//
// Отдельным файлом, потому что это единственное изменяемое состояние среди фикстур: всё
// остальное здесь константы, а правка профиля обязана быть видна следующему GET, иначе
// экран показал бы сохранение состоявшимся, а профиль остался бы прежним.
import { PROFILE } from './people'
import { VIEWER_ID } from './wire'
import type { UserWire } from '../../shared/api/backend/accountContract'

const state = { name: PROFILE.name as string | null, avatar_url: null as string | null }

export function user(): UserWire {
  return {
    id: VIEWER_ID,
    name: state.name,
    avatar_url: state.avatar_url,
    tg_id: null,
    vk_id: null,
    yandex_id: 'ya-1',
    device_id: null,
    tg_json: null,
    yandex_json: { real_name: PROFILE.name },
    vk_json: null,
    guest_json: null,
    user_type: 'regular',
    role: 'admin',
    is_verified: true,
    is_guest: false,
    created_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: null,
  }
}

export function renameUser(name: string): UserWire {
  state.name = name.trim() || null
  return user()
}

export function setUserPhoto(): UserWire {
  // Любая картинка, которую отдаёт сам превью-сервер: заглушке важно, что ссылка есть.
  state.avatar_url = '/brand/logo.svg'
  return user()
}

export function dropUserPhoto(): UserWire {
  state.avatar_url = null
  return user()
}
