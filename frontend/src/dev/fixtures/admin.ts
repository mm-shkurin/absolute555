// Люди, карточка и журнал для заглушки. Записей нарочно больше одной страницы: без
// этого пагинация выглядела бы работающей, ни разу не показав вторую страницу.
import type {
  AuditEntryWire,
  UserCardWire,
  UserSummaryWire,
} from '../../shared/api/backend/adminContract'

const DAYS = 24 * 3600_000

const NAMES = [
  'Пелагея Кузнецова',
  'Игорь Ветров',
  'Тимур Салимов',
  'Дарья Носова',
  'Артём Лебедев',
  'Нина Кравцова',
  'Олег Сомов',
  'Мария Гущина',
]

const PEOPLE: UserSummaryWire[] = Array.from({ length: 23 }, (_, index) => ({
  id: `p${index + 1}`,
  role: index === 0 ? 'admin' : index < 3 ? 'manager' : index < 6 ? 'importer' : 'user',
  is_verified: index % 3 !== 0,
  is_blocked: index === 4 || index === 11,
  created_at: new Date(Date.now() - (index + 1) * 9 * DAYS).toISOString(),
  name: NAMES[index % NAMES.length],
  avatar_url: null,
  // Двое ушли сами: список обязан отличать их от закрытых доступом, иначе модератор
  // пишет тому, кого уже нет.
  deleted_at:
    index === 7 || index === 15 ? new Date(Date.now() - index * DAYS).toISOString() : null,
  platform: index % 2 === 0 ? 'yandex' : 'vk',
}))

export function peoplePage(params: URLSearchParams) {
  const query = (params.get('query') ?? '').trim().toLowerCase()
  const role = params.get('role')
  const blocked = params.get('blocked')
  const page = Number(params.get('page') ?? '1')
  const size = Number(params.get('page_size') ?? '20')

  // Фильтрует заглушка ровно по тем же трём признакам, что и сервер: фильтр, который
  // на заглушке не действует, прячет расхождение параметра и выдачи.
  const found = PEOPLE.map((one) => ({ ...one, is_blocked: closed.has(one.id) })).filter((one) => {
    if (query && !(one.name ?? '').toLowerCase().includes(query)) return false
    if (role && one.role !== role) return false
    if (blocked !== null && one.is_blocked !== (blocked === 'true')) return false
    return true
  })

  return {
    items: found.slice((page - 1) * size, page * size),
    total: found.length,
    page,
    page_size: size,
  }
}

// Закрытие доступа меняет то, что прочитает следующий запрос: карточка, перечитанная
// после действия, обязана показать его результат — иначе экран выглядит сломанным
// ровно там, где он работает.
const closed = new Map<string, string>(
  PEOPLE.filter((one) => one.is_blocked).map((one) => [one.id, 'объявления с чужими фотографиями']),
)

function blockedNow(userId: string): boolean {
  return closed.has(userId)
}

export function personCard(userId: string): UserCardWire {
  const found = PEOPLE.find((one) => one.id === userId) ?? PEOPLE[0]
  const blocked = blockedNow(found.id)
  return {
    ...found,
    is_blocked: blocked,
    blocked_reason: closed.get(found.id) ?? null,
    blocked_at: blocked ? new Date(Date.now() - 2 * DAYS).toISOString() : null,
    listings_total: 4,
    complaints_total: blocked ? 3 : 0,
  }
}

export function personJournal(userId: string): AuditEntryWire[] {
  const person = PEOPLE.find((one) => one.id === userId) ?? PEOPLE[0]
  if (!blockedNow(person.id)) return []
  return [
    {
      id: `${person.id}-a2`,
      action: 'blocked',
      actor_id: 'p1',
      actor_name: NAMES[0],
      reason: 'объявления с чужими фотографиями',
      details: null,
      created_at: new Date(Date.now() - 2 * DAYS).toISOString(),
    },
    {
      id: `${person.id}-a1`,
      action: 'role_changed',
      actor_id: 'p1',
      actor_name: NAMES[0],
      reason: 'берёт очередь модерации',
      details: 'user → manager',
      created_at: new Date(Date.now() - 30 * DAYS).toISOString(),
    },
  ]
}

export function accessChanged(userId: string, blocked: boolean, reason: string) {
  if (blocked) closed.set(userId, reason)
  else closed.delete(userId)
  return {
    id: userId,
    is_blocked: blocked,
    blocked_reason: blocked ? reason : null,
    blocked_at: blocked ? new Date().toISOString() : null,
  }
}

export function roleStats() {
  return {
    total_users: PEOPLE.length,
    users_by_role: {
      guest: 0,
      user: PEOPLE.filter((one) => one.role === 'user').length,
      importer: PEOPLE.filter((one) => one.role === 'importer').length,
      manager: PEOPLE.filter((one) => one.role === 'manager').length,
      admin: PEOPLE.filter((one) => one.role === 'admin').length,
    },
    verified_users: PEOPLE.filter((one) => one.is_verified).length,
    unverified_users: PEOPLE.filter((one) => !one.is_verified).length,
  }
}
