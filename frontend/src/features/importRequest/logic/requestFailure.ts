// Отказы обратного аукциона переводятся отдельно: у трёх из них есть продолжение,
// которое человек должен прочитать, а не догадаться о нём по «что-то пошло не так».
import { isHttpError } from '../../../shared/api/httpClient'
import { failureText } from '../../../shared/api/failureText'

export function requestFailureText(error: unknown): string {
  if (!isHttpError(error)) return failureText(error)
  if (error.errorCode === 'REQUEST_LIMIT_REACHED') {
    const limit = error.details?.limit
    const count = typeof limit === 'number' ? limit : 3
    return `Открытых заявок уже ${count}. Закройте одну — и заведите новую.`
  }
  if (error.errorCode === 'REQUEST_CLOSED') {
    return 'Заявка закрыта — откликов она больше не принимает.'
  }
  return failureText(error)
}
