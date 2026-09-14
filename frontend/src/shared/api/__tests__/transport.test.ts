import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sendPublic } from '../sendPublic'
import { request } from '../httpClient'
import { withTimeout, isRequestTimeout } from '../requestTimeout'
import { failureText } from '../failureText'
import { BACKEND } from '../backend/paths'
import { fakeServer, resetServer, signedIn, type FakeServer } from '../../../test/fakeServer'

const FEED = BACKEND.saleCar.published

// Запрос, который не отвечает никогда и сдаётся только отмене.
const hanging = (signal: AbortSignal) =>
  new Promise<never>((_, reject) =>
    signal.addEventListener('abort', () => reject(new Error('aborted'))),
  )

let server: FakeServer

beforeEach(() => {
  server = fakeServer()
})
afterEach(resetServer)

// Feature: Площадка открыта без входа
describe('транспорт запросов', () => {
  it('Scenario: гость видит ленту — запрос уходит без токена', async () => {
    // Given человек не вошёл
    server.on('GET', FEED, { status: 200, body: { items: [], total: 0 } })
    // When открывает ленту
    const page = await sendPublic<{ total: number }>(FEED)
    // Then лента пришла, токена в запросе нет
    expect(page.total).toBe(0)
    expect(server.calls[0].authorization).toBeUndefined()
  })

  it('Scenario: вошедший видит ленту как владелец — запрос уходит с токеном', async () => {
    signedIn()
    server.on('GET', FEED, { status: 200, body: { items: [], total: 0 } })

    await sendPublic(FEED)

    expect(server.calls[0].authorization).toBe('Bearer a1')
  })

  it('Scenario: сервер упал — гость видит, что сломалось у нас, а не у него', async () => {
    server.on('GET', FEED, { status: 502 })

    const failure = await sendPublic(FEED).catch((error: unknown) => error)

    expect((failure as Error).message).toBe(
      'Сервис временно недоступен. Мы уже знаем, попробуйте позже.',
    )
  })

  it('Scenario: интернет пропал — просьба проверить связь', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const failure = await sendPublic(FEED).catch((error: unknown) => error)

    expect((failure as Error).message).toBe('Нет связи с сервером. Проверьте интернет и повторите.')
  })

  it('Scenario: сервер молчит — запрос прерывается и говорит, что сервер не ответил', async () => {
    const failure = await withTimeout(hanging, 20).catch((error: unknown) => error)

    expect(isRequestTimeout(failure)).toBe(true)
    expect(failureText(failure)).toBe(
      'Сервер не ответил вовремя. Проверьте связь и попробуйте ещё раз.',
    )
  })

  it('отмена экраном — не таймаут: ушедший с экрана не видит ошибку «сервер не ответил»', async () => {
    const screen = new AbortController()

    const pending = withTimeout(hanging, 10_000, screen.signal).catch((error: unknown) => error)
    screen.abort()

    expect(isRequestTimeout(await pending)).toBe(false)
  })

  it('удаление без тела — законный ответ, а не ошибка разбора', async () => {
    server.on('DELETE', BACKEND.saleCar.one('car1'), { status: 204 })

    await expect(
      request(BACKEND.saleCar.one('car1'), { method: 'DELETE' }),
    ).resolves.toBeUndefined()
  })

  it('отказ на скачивании файла читается как отказ, а не как файл', async () => {
    server.on('GET', BACKEND.saleCar.sts('car1'), {
      status: 404,
      body: { code: 'NOT_FOUND', message: 'нет' },
    })

    const failure = await request(BACKEND.saleCar.sts('car1'), { responseType: 'blob' }).catch(
      (e: unknown) => e,
    )

    expect(failure).toMatchObject({ status: 404, errorCode: 'NOT_FOUND' })
  })

  it('текстовый ответ отдаётся строкой', async () => {
    server.on('GET', '/api/v1/health', { status: 200, body: 'ok' })

    expect(await request('/api/v1/health', { responseType: 'text' })).toBe('"ok"')
  })
})
