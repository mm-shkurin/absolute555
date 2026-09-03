// Провод в то, что читает человек. Единственное место, где учётная запись превращается
// в строку списка и в карточку.
import type {
  AuditEntryWire,
  UserCardWire,
  UserSummaryWire,
} from '../../../shared/api/backend/adminContract'
import type { Role } from '../../../shared/session/authSession'

const ROLE_NAMES: Record<Role, string> = {
  guest: 'Гость',
  user: 'Пользователь',
  importer: 'Поставщик',
  manager: 'Модератор',
  admin: 'Администратор',
}

const ACTION_NAMES: Record<string, string> = {
  role_changed: 'Смена роли',
  blocked: 'Доступ закрыт',
  unblocked: 'Доступ возвращён',
}

const PLATFORM_NAMES: Record<string, string> = {
  yandex: 'Яндекс',
  vk: 'VK',
}

/** Имени может не быть: гостевой вход не несёт профиля, а выдуманное имя хуже пустого —
 *  модератор по нему ищет человека и находит не того. */
export function displayName(name: string | null): string {
  return name?.trim() ? name.trim() : 'Без имени'
}

export function roleName(role: Role): string {
  return ROLE_NAMES[role] ?? role
}

export function platformName(platform: string | null): string | null {
  return platform ? (PLATFORM_NAMES[platform] ?? platform) : null
}

export function actionName(action: string): string {
  return ACTION_NAMES[action] ?? action
}

export interface PersonRow {
  id: string
  name: string
  role: string
  platform: string | null
  blocked: boolean
  since: string
}

export function toPersonRow(wire: UserSummaryWire): PersonRow {
  return {
    id: wire.id,
    name: displayName(wire.name),
    role: roleName(wire.role),
    platform: platformName(wire.platform),
    blocked: wire.is_blocked,
    since: formatDay(wire.created_at),
  }
}

export interface PersonCard extends PersonRow {
  blockedReason: string | null
  listings: number
  complaints: number
}

export function toPersonCard(wire: UserCardWire): PersonCard {
  return {
    ...toPersonRow(wire),
    blockedReason: wire.blocked_reason,
    listings: wire.listings_total,
    complaints: wire.complaints_total,
  }
}

export interface JournalRow {
  id: string
  action: string
  actor: string
  reason: string
  details: string | null
  at: string
}

export function toJournalRow(wire: AuditEntryWire): JournalRow {
  return {
    id: wire.id,
    action: actionName(wire.action),
    actor: displayName(wire.actor_name),
    reason: wire.reason,
    details: wire.details,
    at: formatDay(wire.created_at),
  }
}

/** Сколько страниц при этом размере. Ноль записей — одна страница, а не ноль: экран
 *  всё равно показывает первую, и «страница 1 из 0» читается как поломка. */
export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / Math.max(pageSize, 1)))
}

function formatDay(value: string): string {
  const at = new Date(value)
  return Number.isNaN(at.getTime())
    ? ''
    : at.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
