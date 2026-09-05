import { describe, expect, it } from 'vitest'
import { toProfileWire } from '../fromUser'
import type { UserWire } from '../../../../shared/api/backend/accountContract'

const user = (over: Partial<UserWire> = {}): UserWire => ({
  id: 'u1',
  name: null,
  avatar_url: null,
  tg_id: null,
  vk_id: null,
  yandex_id: null,
  device_id: null,
  tg_json: null,
  yandex_json: null,
  vk_json: null,
  guest_json: null,
  user_type: 'regular',
  role: 'user',
  is_verified: true,
  is_guest: false,
  created_at: '2026-03-14T10:00:00Z',
  updated_at: null,
  ...over,
})

const none = { total: 0, rejected: 0 }

describe('профиль из строки пользователя', () => {
  it('берёт имя из ответа провайдера, которым человек вошёл', () => {
    const wire = toProfileWire(user({ yandex_json: { real_name: 'Иван Петров' } }), none)
    expect(wire.name).toBe('Иван Петров')
  })

  it('называет гостя гостем, а не пустотой', () => {
    expect(toProfileWire(user({ is_guest: true }), none).name).toBe('Гость')
  })

  it('оставляет имя пустым, если провайдер его не дал: выдумывать нечего', () => {
    expect(toProfileWire(user({ vk_json: { id: 12 } }), none).name).toBe('')
  })

  it('держит рейтинг неизвестным, а не нулевым: ноль читался бы как оценка', () => {
    const wire = toProfileWire(user(), none)
    expect(wire.rating).toBeNull()
    expect(wire.deals_count).toBe(0)
  })

  it('считает объявления и отклонённые по собственной выдаче', () => {
    const wire = toProfileWire(user(), { total: 4, rejected: 1 })
    expect(wire.listings_count).toBe(4)
    expect(wire.rejected_listings).toBe(1)
  })

  it('показывает месяц регистрации словами', () => {
    expect(toProfileWire(user(), none).member_since).toBe('март 2026 г.')
  })
})

describe('имя и фотография профиля (история 21)', () => {
  it('предпочитает своё имя имени провайдера', () => {
    const wire = toProfileWire(
      user({ name: 'Пётр Кузнецов', yandex_json: { real_name: 'Пётр К.' } }),
      { total: 0, rejected: 0 },
    )

    expect(wire.name).toBe('Пётр Кузнецов')
  })

  it('падает обратно на провайдера, когда своего имени нет', () => {
    const wire = toProfileWire(
      user({ name: null, yandex_json: { real_name: 'Пётр К.' } }),
      { total: 0, rejected: 0 },
    )

    expect(wire.name).toBe('Пётр К.')
  })

  it('не выдумывает имя, когда его нет нигде', () => {
    const wire = toProfileWire(user({ name: null }), { total: 0, rejected: 0 })

    expect(wire.name).toBe('')
  })

  it('переносит фотографию с провода как есть', () => {
    const wire = toProfileWire(
      user({ avatar_url: 'http://localhost:9000/absolute/u1/avatars/a.png' }),
      { total: 0, rejected: 0 },
    )

    expect(wire.avatar_url).toBe('http://localhost:9000/absolute/u1/avatars/a.png')
  })

  it('оставляет фотографию пустой, а не подставляет заглушку', () => {
    const wire = toProfileWire(user({ avatar_url: null }), { total: 0, rejected: 0 })

    expect(wire.avatar_url).toBeNull()
  })
})
