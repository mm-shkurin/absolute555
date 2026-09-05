// Сессия, профиль и роли.
//
// Вход через Яндекс здесь не начинается: это редирект браузера на серверный адрес,
// а не запрос из приложения — ответ провайдера приходит на серверный callback.
import { request } from '../httpClient'
import { send } from '../send'
import { BACKEND } from './paths'
import type {
  ProfilePatchWire,
  RoleRequestCreate,
  RoleRequestDecision,
  RoleRequestListItemWire,
  RoleRequestStatus,
  RoleRequestWire,
  RoleStatsWire,
  TokenWire,
  UserListItemWire,
  UserRoleInfoWire,
  UserWire,
} from './accountContract'

/** Гость получает пару токенов по идентификатору устройства — ни почты, ни пароля.
 *  Идёт мимо `send`: токена ещё нет, и прикладывать к запросу нечего. */
export function guestLogin(deviceId: string) {
  return request<TokenWire>(BACKEND.auth.guestLogin, {
    method: 'POST',
    body: { device_id: deviceId },
  })
}

export function fetchProfile(signal?: AbortSignal) {
  return send<UserWire>(BACKEND.user.profile, { signal })
}

/** Своё имя вместо имени провайдера. Пустая строка возвращает провайдерское. */
export function renameProfile(name: string) {
  return send<UserWire>(BACKEND.user.profile, {
    method: 'PATCH',
    body: { name } satisfies ProfilePatchWire,
  })
}

export function uploadAvatar(file: File) {
  const form = new FormData()
  form.append('file', file)
  return send<UserWire>(BACKEND.user.avatar, { method: 'PUT', body: form })
}

export function removeAvatar() {
  return send<UserWire>(BACKEND.user.avatar, { method: 'DELETE' })
}

/** Выход отзывает оба токена на сервере: тот, что в заголовке, и присланный телом. */
export function logout(refreshToken: string) {
  return send<void>(BACKEND.auth.logout, {
    method: 'POST',
    body: { refresh_token: refreshToken },
  })
}

/** Удаление своей записи. Объявления и отзывы остаются — правило сервера, не клиента. */
export function deleteAccount() {
  return send<void>(BACKEND.user.account, { method: 'DELETE' })
}

export function fetchUsers(signal?: AbortSignal) {
  return send<UserListItemWire[]>(BACKEND.role.users, { signal })
}

export function fetchRoleInfo(userId: string, signal?: AbortSignal) {
  return send<UserRoleInfoWire>(BACKEND.role.roleInfo(userId), { signal })
}

export function fetchRoleStats(signal?: AbortSignal) {
  return send<RoleStatsWire>(BACKEND.role.stats, { signal })
}

/** Причина обязательна: смена роли — решение, которое потом читают. */
export function changeUserRole(userId: string, newRole: string, reason: string) {
  return send<Record<string, unknown>>(BACKEND.role.userRole(userId), {
    method: 'PUT',
    body: { new_role: newRole, reason },
  })
}

export function requestRole(payload: RoleRequestCreate) {
  return send<RoleRequestWire>(BACKEND.role.request, { method: 'POST', body: payload })
}

export function fetchMyRoleRequests(signal?: AbortSignal) {
  return send<RoleRequestWire[]>(BACKEND.role.myRequests, { signal })
}

/** Очередь заявок. Без статуса приезжают все — фильтр задаёт вкладка экрана. */
export function fetchRoleRequests(status?: RoleRequestStatus, signal?: AbortSignal) {
  const path = status ? `${BACKEND.role.requests}?status=${status}` : BACKEND.role.requests
  return send<RoleRequestListItemWire[]>(path, { signal })
}

export function answerRoleRequest(requestId: string, decision: RoleRequestDecision) {
  return send<RoleRequestWire>(BACKEND.role.answerRequest(requestId), {
    method: 'PUT',
    body: decision,
  })
}
