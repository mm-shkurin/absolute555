import { describe, expect, it } from 'vitest'
import { roleFrom } from '../authSession'

describe('роль с сервера в роль экрана', () => {
  it('поставщик остаётся поставщиком — иначе ему не видна лента спроса', () => {
    expect(roleFrom('importer')).toBe('importer')
  })

  it('серверный гость и незнакомая роль читаются как обычный пользователь', () => {
    expect(roleFrom('guest')).toBe('user')
    expect(roleFrom('owner')).toBe('user')
    expect(roleFrom(null)).toBe('user')
  })

  it('модераторские роли переходят как есть', () => {
    expect(roleFrom('manager')).toBe('manager')
    expect(roleFrom('admin')).toBe('admin')
  })
})
