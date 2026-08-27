// Ограничение по времени для любого промиса запроса.
//
// Отклонение и только отклонение: автоповтора здесь нет намеренно. Повтор на таймауте —
// это второй POST, который сервер уже мог принять; дубликат объявления или дубликат оффера
// хуже, чем сообщение об ошибке.
import { REQUEST_TIMEOUT_MS } from '../config/runtime'

export { REQUEST_TIMEOUT_MS }

export class RequestTimeoutError extends Error {
  constructor(ms: number) {
    super(`Запрос не ответил за ${Math.round(ms / 1000)} с.`)
    this.name = 'RequestTimeoutError'
  }
}

export function isRequestTimeout(error: unknown): error is RequestTimeoutError {
  return error instanceof RequestTimeoutError
}

// Сигнал вызывающего (размонтированный компонент, устаревший поиск) не заменяет собственный
// сигнал транспорта, а складывается с ним: запрос обязан быть ограничен, даже когда его
// никто не отменяет, и обязан прекратиться немедленно, когда отменяют.
export async function withTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  ms: number = REQUEST_TIMEOUT_MS,
  external?: AbortSignal,
): Promise<T> {
  const controller = new AbortController()
  const abortExternally = () => controller.abort()
  external?.addEventListener('abort', abortExternally)

  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await run(controller.signal)
  } catch (error) {
    if (controller.signal.aborted && !external?.aborted) throw new RequestTimeoutError(ms)
    throw error
  } finally {
    clearTimeout(timer)
    external?.removeEventListener('abort', abortExternally)
  }
}
