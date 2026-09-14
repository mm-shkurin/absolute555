// Слой сессии: пара токенов и роль вошедшего. Не фича — инфраструктура, на которой фичи
// стоят. Экраны входа остаются в `features/auth`; всё, что читает «кто смотрит», приходит
// сюда, а не вниз в фичу.
//
// Роль здесь не для запрета, а для показа. Настоящая проверка прав — на бэкенде; клиент,
// прячущий кнопку, экономит человеку бессмысленное действие, а не защищает данные.
import { browserStorage } from '../lib/browser'
import { notify, subscribe, type Listener } from '../lib/listeners'

// Пять ролей из UserFlows. Продавец и покупатель — одна роль `user`: один и тот же человек
// продаёт свою машину и торгуется за чужую, развилки «войти как продавец» в продукте нет.
export type Role = 'guest' | 'user' | 'importer' | 'manager' | 'admin'

export interface Session {
  accessToken: string
  refreshToken: string
  userId: string
  role: Role
  displayName: string
  avatarUrl: string | null
}

const STORAGE_KEY = 'absolute.session'

let current: Session | null = null
let loaded = false

const listeners = new Set<Listener>()

export function subscribeToSession(listener: Listener): () => void {
  return subscribe(listeners, listener)
}

export function currentSession(): Session | null {
  if (!loaded) {
    current = readStored()
    loaded = true
  }
  return current
}

export function currentRole(): Role {
  return currentSession()?.role ?? 'guest'
}

export function isSignedIn(): boolean {
  return currentSession() !== null
}

// Может ли этот человек модерировать. Именованный предикат, а не сравнение роли по месту:
// набор ролей менялся уже дважды, и каждое сравнение по месту — это место, где его забудут.
export function canModerate(role: Role = currentRole()): boolean {
  return role === 'manager' || role === 'admin'
}

// Заявки на роль разбирает тот же человек, что и очередь объявлений: право
// VIEW_ROLE_REQUESTS есть у manager и у admin (история 13). Какие роли модератор вправе
// выдать — правило сервера: свою и выше он не выдаёт, и клиент это не повторяет.
export function canReviewRoleRequests(role: Role = currentRole()): boolean {
  return role === 'manager' || role === 'admin'
}

export function startSession(session: Session): void {
  current = session
  loaded = true
  write(session)
  notify(listeners)
}

// Обновление меняет только токены. Роль и имя переписывать нечем: ответ `/auth/refresh`
// их не несёт, а подстановка пустых значений выкинула бы человека из модерации.
export function renewTokens(accessToken: string, refreshToken: string): void {
  const session = currentSession()
  if (!session) return
  startSession({ ...session, accessToken, refreshToken })
}

// Роли сервера и роли экрана совпадают не полностью: гость на сервере — это учётная
// запись, тогда как на экране гость означает «сессии нет». Незнакомая роль читается как
// обычный пользователь: скрыть лишнюю кнопку безопаснее, чем показать чужую.
const ROLES: Record<string, Role> = {
  user: 'user',
  admin: 'admin',
  manager: 'manager',
  importer: 'importer',
  guest: 'user',
}

export function roleFrom(serverRole: string | null | undefined): Role {
  return ROLES[serverRole ?? ''] ?? 'user'
}

// Имя, фотография и роль меняются вне сессии — в профиле и в разборе заявки на роль, — а
// шапка и экраны читают сессию: без этого одобренный поставщик оставался покупателем до
// следующего входа.
export function updateIdentity(displayName: string, avatarUrl: string | null, role?: Role): void {
  const session = currentSession()
  if (!session) return
  const nextRole = role ?? session.role
  if (
    session.displayName === displayName &&
    session.avatarUrl === avatarUrl &&
    session.role === nextRole
  ) {
    return
  }
  startSession({ ...session, displayName, avatarUrl, role: nextRole })
}

export function endSession(): void {
  current = null
  loaded = true
  browserStorage()?.removeItem(STORAGE_KEY)
  notify(listeners)
}

function write(session: Session): void {
  try {
    browserStorage()?.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Приватное окно или запрещённые данные сайта. Сессия останется в памяти вкладки:
    // работать можно, переживёт перезагрузку — нет. Это лучше, чем упасть на входе.
  }
}

const SESSION_ROLES: ReadonlySet<string> = new Set([
  'guest',
  'user',
  'importer',
  'manager',
  'admin',
])

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  return (
    typeof s.accessToken === 'string' &&
    s.accessToken !== '' &&
    typeof s.refreshToken === 'string' &&
    typeof s.userId === 'string' &&
    s.userId !== '' &&
    typeof s.role === 'string' &&
    SESSION_ROLES.has(s.role) &&
    typeof s.displayName === 'string' &&
    (s.avatarUrl === null || typeof s.avatarUrl === 'string')
  )
}

function readStored(): Session | null {
  const raw = browserStorage()?.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return isSession(parsed) ? parsed : null
  } catch {
    return null
  }
}
