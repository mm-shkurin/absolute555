// Подменный сервер для тестов хуков: `fetch` отвечает по методу и пути, а каждый запрос
// записывается с разобранным телом — так тест видит ровно то, что ушло бы на провод.
import { vi } from 'vitest'
import { endSession, startSession } from '../shared/session/authSession'

export interface Call {
  method: string
  path: string
  body: unknown
  authorization?: string
}

type Reply = { status: number; body?: unknown }
type Handler = (call: Call) => Reply

export interface FakeServer {
  calls: Call[]
  on: (method: string, path: string, handler: Handler | Reply) => void
  callsTo: (method: string, path: string) => Call[]
}

function parsed(body: unknown): unknown {
  if (typeof body !== 'string') return body
  try {
    return JSON.parse(body)
  } catch {
    return body
  }
}

export function fakeServer(): FakeServer {
  const routes: { method: string; path: string; handler: Handler }[] = []
  const calls: Call[] = []

  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const headers = (init.headers ?? {}) as Record<string, string>
      const call = {
        method: init.method ?? 'GET',
        path: String(url),
        body: parsed(init.body),
        authorization: headers.Authorization,
      }
      calls.push(call)
      // Маршрут — путь без строки запроса: фильтры и вкладки проверяет тест по `calls`.
      // Побеждает последний объявленный: тест переопределяет ответ из `beforeEach`.
      const bare = call.path.split('?')[0]
      const route = routes.findLast((one) => one.method === call.method && one.path === bare)
      const reply = route ? route.handler(call) : { status: 404, body: { code: 'NOT_FOUND' } }
      return new Response(reply.body === undefined ? null : JSON.stringify(reply.body), {
        status: reply.status,
      })
    }),
  )

  return {
    calls,
    on: (method, path, handler) =>
      routes.push({ method, path, handler: typeof handler === 'function' ? handler : () => handler }),
    callsTo: (method, path) => calls.filter((one) => one.method === method && one.path === path),
  }
}

export function signedIn(userId = 'u1', role: 'user' | 'importer' | 'manager' | 'admin' = 'user') {
  startSession({
    accessToken: 'a1',
    refreshToken: 'r1',
    userId,
    role,
    displayName: 'Продавец',
    avatarUrl: null,
  })
}

export function resetServer() {
  vi.unstubAllGlobals()
  endSession()
}
