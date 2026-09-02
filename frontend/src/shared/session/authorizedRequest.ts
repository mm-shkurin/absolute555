// Запрос с токеном: приложить access, а на 401 — обновить сессию и повторить ровно один раз.
//
// Повтор один, и это не осторожность, а необходимость: второй 401 после свежего токена
// означает, что сессия действительно кончилась, и цикл «обновить и повторить» на таком
// ответе крутился бы до таймаута, показывая человеку спиннер вместо экрана входа.
import { isHttpError, request, type RequestOptions } from '../api/httpClient'
import { currentSession, endSession, renewTokens } from './authSession'
import { refreshTokens } from './refreshApi'

export class SessionExpiredError extends Error {
  constructor() {
    super('Сессия истекла. Войдите заново.')
    this.name = 'SessionExpiredError'
  }
}

export function isSessionExpired(error: unknown): error is SessionExpiredError {
  return error instanceof SessionExpiredError
}

// Одно обновление на все параллельные запросы. Без этого экран, который грузит ленту,
// офферы и непрочитанное сразу, отправляет три обновления с одним и тем же refresh-токеном,
// и два из них сервер отвергает как повторное использование.
let inFlight: Promise<boolean> | null = null

export async function authorizedRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const session = currentSession()
  if (!session) throw new SessionExpiredError()

  try {
    return await request<T>(path, withToken(options, session.accessToken))
  } catch (error) {
    if (!isUnauthorized(error)) throw error
    if (!(await renewOnce())) {
      endSession()
      throw new SessionExpiredError()
    }
    const renewed = currentSession()
    if (!renewed) throw new SessionExpiredError()
    return request<T>(path, withToken(options, renewed.accessToken))
  }
}

function withToken(options: RequestOptions, token: string): RequestOptions {
  return { ...options, headers: { ...options.headers, Authorization: `Bearer ${token}` } }
}

function isUnauthorized(error: unknown): boolean {
  return isHttpError(error) && error.status === 401
}

async function renewOnce(): Promise<boolean> {
  inFlight ??= performRenewal().finally(() => {
    inFlight = null
  })
  return inFlight
}

async function performRenewal(): Promise<boolean> {
  const session = currentSession()
  if (!session) return false
  try {
    const pair = await refreshTokens(session.refreshToken)
    renewTokens(pair.accessToken, pair.refreshToken)
    return true
  } catch {
    return false
  }
}
