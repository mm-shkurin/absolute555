// Консоль: люди, карточка, журнал, закрытие и возврат доступа.
import { send } from '../send'
import { BACKEND } from './paths'
import type {
  AuditEntryWire,
  PeopleQuery,
  UserAccessWire,
  UserCardWire,
  UserPageWire,
} from './adminContract'

function withQuery(path: string, query: PeopleQuery): string {
  const params = new URLSearchParams()
  if (query.query) params.set('query', query.query)
  if (query.role) params.set('role', query.role)
  if (query.blocked !== undefined) params.set('blocked', String(query.blocked))
  if (query.deleted !== undefined) params.set('deleted', String(query.deleted))
  if (query.page !== undefined) params.set('page', String(query.page))
  if (query.page_size !== undefined) params.set('page_size', String(query.page_size))
  const search = params.toString()
  return search ? `${path}?${search}` : path
}

/** Страница списка. Всю таблицу сервер не отдаёт намеренно — истории 23. */
export function fetchPeople(query: PeopleQuery = {}, signal?: AbortSignal) {
  return send<UserPageWire>(withQuery(BACKEND.admin.users, query), { signal })
}

export function fetchUserCard(userId: string, signal?: AbortSignal) {
  return send<UserCardWire>(BACKEND.admin.user(userId), { signal })
}

/** Журнал доступен только администратору: модератору сервер отвечает отказом, и экран
 *  не показывает раздел, которого тот всё равно не получит. */
export function fetchUserAudit(userId: string, signal?: AbortSignal) {
  return send<AuditEntryWire[]>(BACKEND.admin.userAudit(userId), { signal })
}

export function blockUser(userId: string, reason: string) {
  return send<UserAccessWire>(BACKEND.admin.blockUser(userId), {
    method: 'POST',
    body: { reason },
  })
}

export function unblockUser(userId: string, reason: string) {
  return send<UserAccessWire>(BACKEND.admin.unblockUser(userId), {
    method: 'POST',
    body: { reason },
  })
}
