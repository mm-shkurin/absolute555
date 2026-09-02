// Транспорт для каждого обращения к бэкенду: собрать запрос, превратить не-ok в HttpError,
// вернуть разобранное тело. Про авторизацию не знает НИЧЕГО, и это намеренно.
//
// Токен здесь означал бы импорт сессии, а клиент обновления сессии тогда импортировал бы
// клиент, который её обновляет, — цикл, и обновление, способное уйти в рекурсию через
// собственный 401. Авторизация живёт ровно слоем выше, в `shared/session/authorizedRequest`,
// а запросы без токена (старт OAuth, обмен кода, обновление) зовут этот модуль напрямую.
import { readSuccessBody, toHttpError, type ResponseType } from './httpResponse'
import { REQUEST_TIMEOUT_MS, withTimeout } from './requestTimeout'

export { isHttpError, type HttpError } from './httpResponse'
export { REQUEST_TIMEOUT_MS, RequestTimeoutError, isRequestTimeout } from './requestTimeout'

// Пусто по умолчанию — тогда запросы идут через дев-прокси Vite: /api на бэкенд.
const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? ''

export interface RequestOptions {
  method?: string
  headers?: Record<string, string>
  body?: unknown
  responseType?: ResponseType
  signal?: AbortSignal
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return withTimeout(
    (signal) => performRequest<T>(path, options, signal),
    REQUEST_TIMEOUT_MS,
    options.signal,
  )
}

// Бинарное тело уходит на провод нетронутым: фотографии СТС, кузова и экрана толщиномера
// отправляются байтами, а JSON.stringify от Blob даёт строку из двух символов — загрузку,
// которую сервер отвергает как битый файл без единой подсказки почему.
function isBinary(body: unknown): boolean {
  return (
    body instanceof Blob ||
    body instanceof FormData ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  )
}

function buildInit(options: RequestOptions, signal: AbortSignal): RequestInit {
  const { method = 'GET', headers = {}, body } = options
  const binary = isBinary(body)
  return {
    method,
    signal,
    // Content-Type правдив только когда тело есть. На GET он обещает серверу JSON,
    // который никогда не придёт.
    headers:
      body === undefined || binary ? headers : { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : binary ? (body as BodyInit) : JSON.stringify(body),
  }
}

async function performRequest<T>(
  path: string,
  options: RequestOptions,
  signal: AbortSignal,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, buildInit(options, signal))
  if (!res.ok) throw await toHttpError(res)
  return readSuccessBody<T>(res, options.responseType ?? 'json')
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body })
}
