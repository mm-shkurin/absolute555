// То, чем пользуются все клиенты фич: приложить сессию и превратить отказ в текст, который
// можно показать человеку. Второй такой же кусок в фиче — это второе место, где однажды
// забудут пропустить истёкшую сессию мимо общего сообщения.
import { authorizedRequest } from '../session/authorizedRequest'
import { translatedFailure } from './translateFailure'
import type { RequestOptions } from './httpClient'

export async function send<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await authorizedRequest<T>(path, options)
  } catch (error) {
    throw translatedFailure(error)
  }
}
