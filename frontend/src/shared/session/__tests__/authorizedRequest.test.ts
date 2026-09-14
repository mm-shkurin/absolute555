import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { send } from '../../api/send'
import { BACKEND } from '../../api/backend/paths'
import { closedAccessReason } from '../accessClosed'
import { currentSession } from '../authSession'
import { isSessionExpired } from '../authorizedRequest'
import { fakeServer, resetServer, signedIn, type FakeServer } from '../../../test/fakeServer'

const PROFILE = BACKEND.user.profile

let server: FakeServer

beforeEach(() => {
  server = fakeServer()
  signedIn('u1', 'manager')
})
afterEach(resetServer)

// Feature: Сессия продолжается без повторного входа
describe('запрос с токеном', () => {
  it('Scenario: истёкший токен обновляется, и экран получает данные без входа заново', async () => {
    // Given access-токен истёк, refresh-токен ещё жив
    server.on('GET', PROFILE, (call) =>
      call.authorization === 'Bearer a2' ? { status: 200, body: { name: 'Анна' } } : { status: 401, body: {} },
    )
    server.on('POST', BACKEND.auth.refresh, { status: 200, body: { access_token: 'a2', refresh_token: 'r2' } })
    // When экран запрашивает профиль
    const profile = await send<{ name: string }>(PROFILE)
    // Then данные пришли, сессия продолжена новыми токенами, роль не потеряна
    expect(profile).toEqual({ name: 'Анна' })
    expect(currentSession()).toMatchObject({ accessToken: 'a2', refreshToken: 'r2', role: 'manager' })
  })

  it('Scenario: три экрана сразу получают 401 — токен обновляется один раз', async () => {
    server.on('GET', PROFILE, (call) =>
      call.authorization === 'Bearer a2' ? { status: 200, body: {} } : { status: 401, body: {} },
    )
    server.on('POST', BACKEND.auth.refresh, { status: 200, body: { access_token: 'a2', refresh_token: 'r2' } })

    await Promise.all([send(PROFILE), send(PROFILE), send(PROFILE)])

    expect(server.callsTo('POST', BACKEND.auth.refresh)).toHaveLength(1)
  })

  it('Scenario: refresh-токен тоже истёк — человек отправляется на вход', async () => {
    server.on('GET', PROFILE, { status: 401, body: {} })
    server.on('POST', BACKEND.auth.refresh, { status: 401, body: {} })

    const failure = await send(PROFILE).catch((error: unknown) => error)

    expect(isSessionExpired(failure)).toBe(true)
    expect(currentSession()).toBeNull()
  })

  it('Scenario: доступ закрыт — сессия завершена, причина сохранена для экрана', async () => {
    server.on('GET', PROFILE, {
      status: 403,
      body: { code: 'USER_BLOCKED', message: 'Нарушение правил площадки' },
    })

    const failure = await send(PROFILE).catch((error: unknown) => error)

    expect((failure as Error).name).toBe('AccessClosedError')
    expect(closedAccessReason()).toBe('Нарушение правил площадки')
    expect(currentSession()).toBeNull()
    expect(server.callsTo('POST', BACKEND.auth.refresh)).toEqual([])
  })

  it('Scenario: обычный запрет показывается текстом, сессия остаётся', async () => {
    server.on('GET', PROFILE, { status: 403, body: { code: 'FORBIDDEN', message: 'no' } })

    const failure = await send(PROFILE).catch((error: unknown) => error)

    expect((failure as Error).message).toBe('Для этого действия не хватает прав.')
    expect(currentSession()).not.toBeNull()
  })

  it('без сессии запрос не уходит — сразу экран входа', async () => {
    resetServer()
    server = fakeServer()

    const failure = await send(PROFILE).catch((error: unknown) => error)

    expect(isSessionExpired(failure)).toBe(true)
    expect(server.calls).toEqual([])
  })
})
