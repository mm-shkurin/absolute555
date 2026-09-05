import { describe, expect, it } from 'vitest'
import type {
  AuditEntryWire,
  UserCardWire,
  UserSummaryWire,
} from '../../../../shared/api/backend/adminContract'
import {
  displayName,
  pageCount,
  platformName,
  roleName,
  toJournalRow,
  toPersonCard,
  toPersonRow,
} from '../peopleView'

const SUMMARY: UserSummaryWire = {
  id: 'p1',
  role: 'manager',
  is_verified: true,
  is_blocked: false,
  created_at: '2026-03-04T10:00:00Z',
  avatar_url: null,
  deleted_at: null,
  name: 'Пелагея Кузнецова',
  platform: 'yandex',
}

describe('люди в консоли', () => {
  it('называет роль и способ входа по-русски', () => {
    const row = toPersonRow(SUMMARY)

    expect(row.role).toBe('Модератор')
    expect(row.platform).toBe('Яндекс')
    expect(row.since).toBe('04.03.2026')
  })

  it('не выдумывает имя, когда профиля нет', () => {
    // Гостевой вход не несёт профиля. Выдуманное имя хуже пустого: модератор ищет по
    // нему человека и находит не того.
    expect(displayName(null)).toBe('Без имени')
    expect(displayName('   ')).toBe('Без имени')
  })

  it('оставляет незнакомую роль и площадку как есть', () => {
    // Роль, о которой экран не знает, — это роль, добавленная сервером. Показать её
    // значением честнее, чем спрятать под «пользователь».
    expect(roleName('owner' as never)).toBe('owner')
    expect(platformName('telegram')).toBe('telegram')
    expect(platformName(null)).toBeNull()
  })

  it('несёт в карточку то, по чему судят: жалобы, объявления и причину закрытия', () => {
    const wire: UserCardWire = {
      ...SUMMARY,
      is_blocked: true,
      blocked_reason: 'объявления с чужими фотографиями',
      blocked_at: '2026-09-01T09:00:00Z',
      listings_total: 4,
      complaints_total: 3,
    }

    const card = toPersonCard(wire)

    expect(card.blocked).toBe(true)
    expect(card.blockedReason).toBe('объявления с чужими фотографиями')
    expect(card.listings).toBe(4)
    expect(card.complaints).toBe(3)
  })

  it('переводит запись журнала вместе с тем, из какой роли в какую', () => {
    const wire: AuditEntryWire = {
      id: 'a1',
      action: 'role_changed',
      actor_id: 'p9',
      actor_name: 'Игорь Ветров',
      reason: 'берёт очередь модерации',
      details: 'user → manager',
      created_at: '2026-09-02T12:00:00Z',
    }

    const row = toJournalRow(wire)

    expect(row.action).toBe('Смена роли')
    expect(row.actor).toBe('Игорь Ветров')
    expect(row.details).toBe('user → manager')
  })

  it('считает страницы, а на пустом списке оставляет одну', () => {
    expect(pageCount(23, 20)).toBe(2)
    expect(pageCount(20, 20)).toBe(1)
    // Не ноль: экран всё равно показывает первую страницу, и «1 из 0» читается как
    // поломка, а не как пустой список.
    expect(pageCount(0, 20)).toBe(1)
  })
})

describe('ушедший человек в консоли (история 24)', () => {
  it('помечает того, кто удалил свою запись', () => {
    const row = toPersonRow({ ...SUMMARY, deleted_at: '2026-09-03T10:00:00Z' })

    expect(row.departed).toBe(true)
  })

  it('не путает ушедшего с закрытым доступом', () => {
    const blocked = toPersonRow({ ...SUMMARY, is_blocked: true, deleted_at: null })

    expect(blocked.blocked).toBe(true)
    expect(blocked.departed).toBe(false)
  })

  it('живого не помечает', () => {
    expect(toPersonRow(SUMMARY).departed).toBe(false)
  })
})
