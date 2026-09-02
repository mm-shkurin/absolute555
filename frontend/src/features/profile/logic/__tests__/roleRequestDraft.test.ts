import { describe, expect, it } from 'vitest'
import { emptyRoleRequestDraft, missingForRoleRequest } from '../roleRequestDraft'

describe('заявка на роль', () => {
  it('пустая заявка называет, чего не хватает', () => {
    expect(missingForRoleRequest(emptyRoleRequestDraft)).toEqual([
      'зачем вам роль',
      'рассказ об опыте',
    ])
  })

  // Документы площадка не проверяет: решение принимается по тексту, и короткая отписка
  // не даёт модератору ничего, на чём решать.
  it('короткий рассказ не считается рассказом', () => {
    expect(missingForRoleRequest({ reason: 'Вожу машины', about: 'Вожу.' })).toEqual([
      'рассказ об опыте',
    ])
  })

  it('заполненная заявка отправляется', () => {
    expect(
      missingForRoleRequest({
        reason: 'Хочу выставлять позиции сам',
        about: 'Вожу из Японии пятый год, работаю через партнёра во Владивостоке.',
      }),
    ).toEqual([])
  })
})
