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

/** Отказ сервера — в том числе завёрнутый.
 *
 *  `send` оборачивает ошибку в новую с человеческим текстом, а исходную кладёт в
 *  `cause`. Пока проверка смотрела только на верхний объект, экраны теряли и статус, и
 *  код: мастер продажи на честный отказ «не хватает фотографий» показывал «нет связи с
 *  сервером» — то есть отправлял человека чинить интернет вместо объявления. */
export function isHttpError(error: unknown): error is HttpError {
  return httpErrorIn(error) !== null
}

/** Сам отказ, где бы он ни лежал: на объекте или в цепочке `cause`. */
export function httpErrorIn(error: unknown): HttpError | null {
  let step: unknown = error
  // Цепочка `cause` конечна, но глубину ограничиваем: испорченный объект с ссылкой на
  // себя не должен вешать перевод ошибки в бесконечном цикле.
  for (let depth = 0; step instanceof Error && depth < 5; depth += 1) {
    if (typeof (step as HttpError).status === 'number') return step as HttpError
    step = (step as { cause?: unknown }).cause
  }
  return null
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
  let raw: unknown
  try {
    raw = await res.json()
  } catch {
    // Пустое тело или не-JSON — обычный случай для 502 от прокси. Статуса достаточно.
    return undefined
  }
  return toErrorBody(raw)
}

// Прокси и чужие шлюзы отвечают чем угодно; поле неверного типа отбрасывается, а не
// попадает в текст ошибки или в ветвление по коду.
function toErrorBody(raw: unknown): ErrorBody | undefined {
  if (!isRecord(raw)) return undefined
  return {
    code: stringField(raw.code),
    error_code: stringField(raw.error_code),
    detail: stringField(raw.detail),
    message: stringField(raw.message),
    details: isRecord(raw.details) ? raw.details : undefined,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringField(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

export type BodyGuard = (value: unknown) => boolean

export class UnexpectedBodyError extends Error {
  readonly body: unknown

  constructor(body: unknown) {
    super('Сервер вернул ответ неожиданной формы')
    this.name = 'UnexpectedBodyError'
    this.body = body
  }
}

export async function readSuccessBody<T>(
  res: Response,
  type: ResponseType,
  guard?: BodyGuard,
): Promise<T> {
  if (type === 'blob') return (await res.blob()) as T
  if (type === 'text') return (await res.text()) as T
  // 204 без тела — законный ответ на удаление и на подтверждение действия.
  if (res.status === 204) return undefined as T
  const body: unknown = await res.json()
  if (guard && !guard(body)) throw new UnexpectedBodyError(body)
  return body as T
}
