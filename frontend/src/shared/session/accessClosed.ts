// Закрытый доступ — свой исход, а не одна из ошибок.
//
// Общая плашка «не хватает прав» тут врёт дважды: прав не хватает не на действие, а
// вообще, и человек, читающий это как сбой, возвращается снова. Сервер называет причину
// в ответе — она и показывается, потому что оспаривать нечего, если не знаешь за что.
import { isHttpError } from '../api/httpClient'

export const ACCESS_CLOSED_CODE = 'USER_BLOCKED'

export class AccessClosedError extends Error {
  // Поле объявлено отдельно от параметра: сборка запрещает синтаксис параметра-свойства,
  // потому что он не стирается вместе с типами.
  readonly reason: string

  constructor(reason: string) {
    super(reason)
    this.name = 'AccessClosedError'
    this.reason = reason
  }
}

export function isAccessClosed(error: unknown): error is AccessClosedError {
  return error instanceof AccessClosedError
}

/** Отказ сервера, означающий закрытый доступ. Распознаётся по коду, а не по статусу:
 *  403 отвечают и обычные запреты, у которых исход другой. */
export function accessClosedFrom(error: unknown): AccessClosedError | null {
  if (!isHttpError(error) || error.errorCode !== ACCESS_CLOSED_CODE) return null
  return new AccessClosedError(error.message?.trim() || 'Доступ к площадке закрыт.')
}

// Причина переживает переход на экран: ответ, в котором она пришла, к этому моменту уже
// обработан, а показать человеку «доступ закрыт» без «за что» — то же самое, что не
// сказать ничего. Хранится в сессии вкладки: это не тайна, но и не то, что должно
// всплыть через неделю на общем компьютере.
const REASON_KEY = 'access-closed-reason'

const CLOSED_EVENT = 'access-closed'

/** Подписка на закрытие доступа. Событие, а не проверка на каждом экране: отказ приходит
 *  в ответ на любой запрос, и экран, который забыли научить, оставил бы человека с
 *  плашкой «не хватает прав» вместо причины. */
export function onAccessClosed(listener: () => void): () => void {
  window.addEventListener(CLOSED_EVENT, listener)
  return () => window.removeEventListener(CLOSED_EVENT, listener)
}

export function rememberClosedAccess(reason: string): void {
  try {
    sessionStorage.setItem(REASON_KEY, reason)
  } catch {
    // Хранилище может быть закрыто настройками браузера. Экран покажет общий текст —
    // это хуже, чем с причиной, и лучше, чем поломка на пути к нему.
  }
  window.dispatchEvent(new Event(CLOSED_EVENT))
}

export function closedAccessReason(): string {
  try {
    return sessionStorage.getItem(REASON_KEY) || 'Доступ к площадке закрыт.'
  } catch {
    return 'Доступ к площадке закрыт.'
  }
}
