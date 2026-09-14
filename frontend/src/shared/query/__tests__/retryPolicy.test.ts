import { afterEach, describe, expect, it, vi } from 'vitest'
import { shouldRetry } from '../retryPolicy'
import { send } from '../../api/send'
import { endSession, startSession } from '../../session/authSession'

// Отказ берётся из настоящего `send`: экраны получают его завёрнутым, а не голым HttpError.
async function failureOf(status: number, body: unknown): Promise<unknown> {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })))
  startSession({
    accessToken: 'a1',
    refreshToken: 'r1',
    userId: 'u1',
    role: 'user',
    displayName: 'Покупатель',
    avatarUrl: null,
  })
  return send('/api/v1/sale-cars/l1').catch((error: unknown) => error)
}

afterEach(() => {
  vi.unstubAllGlobals()
  endSession()
})

describe('повтор запроса экрана', () => {
  it('Scenario: снятое объявление сразу показывает «не найдено», без повторов', async () => {
    // Given объявление сняли с публикации
    const failure = await failureOf(404, { code: 'LISTING_NOT_FOUND', message: 'нет' })
    // When экран решает, повторять ли запрос
    // Then повтора нет
    expect(shouldRetry(0, failure)).toBe(false)
  })

  it('Scenario: сбой сервера повторяется, но не больше двух раз', async () => {
    const failure = await failureOf(503, {})

    expect([0, 1, 2].map((count) => shouldRetry(count, failure))).toEqual([true, true, false])
  })
})
