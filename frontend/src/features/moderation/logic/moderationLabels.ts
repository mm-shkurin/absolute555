import type { UserRole } from '../../../shared/api/backend/accountContract'
import type { Role } from '../../../shared/session/authSession'

// Роль в заявке и роль в списке людей названы по-разному намеренно: заявка просит
// «поставщика под привоз», а в списке это уже просто «Поставщик».
export const ROLE_IN_APPLICATION: Record<UserRole, string> = {
  guest: 'гость',
  user: 'пользователь',
  importer: 'поставщик под привоз',
  manager: 'модератор',
  admin: 'администратор',
}

export const APPLICATION_STATUS: Record<string, string> = {
  pending: 'на рассмотрении',
  approved: 'одобрена',
  rejected: 'отклонена',
}

export const ROLE_NAME: Record<Role, string> = {
  guest: 'Гость',
  user: 'Пользователь',
  importer: 'Поставщик',
  manager: 'Модератор',
  admin: 'Администратор',
}

export const ACTION_NAME: Record<string, string> = {
  role_changed: 'Смена роли',
  blocked: 'Доступ закрыт',
  unblocked: 'Доступ возвращён',
}

export const PLATFORM_NAME: Record<string, string> = {
  yandex: 'Яндекс',
  vk: 'VK',
}
