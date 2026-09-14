import { isSessionExpired } from '../session/authorizedRequest'
import { httpErrorIn } from '../api/httpClient'

// Повторяем только то, что могло получиться со второго раза. Истёкшая сессия ведёт на
// экран входа, а 4xx — это ответ сервера «так нельзя», и он не изменится от повтора.
// Статус читается из цепочки `cause`: `send` отдаёт отказ завёрнутым, и у обёртки его нет.
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isSessionExpired(error)) return false
  const failure = httpErrorIn(error)
  if (failure && failure.status < 500) return false
  return failureCount < 2
}
