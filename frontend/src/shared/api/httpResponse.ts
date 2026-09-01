// Чтение уже полученного `Response`: успех — в тип вызывающего, отказ — в HttpError.
//
// Тело ошибки всегда читается как JSON, даже когда успех ожидался бинарным. Иначе 4xx
// с JSON-описанием ушёл бы в скачивание как будто это файл — пользователь получил бы
// «документ» на двести байт с текстом ошибки внутри.

export type ResponseType = 'json' | 'blob' | 'text'

export interface HttpError extends Error {
  status: number
  // Машиночитаемый код бэкенда: по нему ветвится обработка, по тексту — только показ.
  errorCode?: string
  /** Поля конкретного отказа. По ним экран переходит к следующему шагу — например к
   *  правке отзыва, чей идентификатор приезжает в отказе на повторный. */
  details?: Record<string, unknown>
  payload?: unknown
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof Error && typeof (error as HttpError).status === 'number'
}

// Форма отказа сервера: `{error, message, code, details}` (`errors.yaml`). `detail` и
// `error_code` остаются запасными ключами: их отдаёт FastAPI на отказах, которые не
// проходят через обработчик приложения.
interface ErrorBody {
  code?: string
  error_code?: string
  detail?: string
  message?: string
  details?: Record<string, unknown>
}

export async function toHttpError(res: Response): Promise<HttpError> {
  const body = await readErrorBody(res)
  const error = new Error(body?.message ?? body?.detail ?? `HTTP ${res.status}`) as HttpError
  error.name = 'HttpError'
  error.status = res.status
  error.errorCode = body?.code ?? body?.error_code
  error.details = body?.details
  error.payload = body
  return error
}

async function readErrorBody(res: Response): Promise<ErrorBody | undefined> {
  try {
    return (await res.json()) as ErrorBody
  } catch {
    // Пустое тело или не-JSON — обычный случай для 502 от прокси. Статуса достаточно.
    return undefined
  }
}

export async function readSuccessBody<T>(res: Response, type: ResponseType): Promise<T> {
  if (type === 'blob') return (await res.blob()) as T
  if (type === 'text') return (await res.text()) as T
  // 204 без тела — законный ответ на удаление и на подтверждение действия.
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
