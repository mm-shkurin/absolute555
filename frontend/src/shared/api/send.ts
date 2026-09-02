// То, чем пользуются все клиенты фич: приложить сессию и превратить отказ в текст, который
// можно показать человеку. Второй такой же кусок в фиче — это второе место, где однажды
// забудут пропустить истёкшую сессию мимо общего сообщения.
import { authorizedRequest } from '../session/authorizedRequest'
import { isSessionExpired } from '../session/authorizedRequest'
import { failureText } from './failureText'
import type { RequestOptions } from './httpClient'

export async function send<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await authorizedRequest<T>(path, options)
  } catch (error) {
    // Истёкшая сессия проходит насквозь: у неё свой исход — экран входа, а не плашка
    // с текстом ошибки. Свернуть её в общее сообщение значит показать человеку
    // «что-то пошло не так» вместо кнопки, которая чинит проблему.
    if (isSessionExpired(error)) throw error
    // Исходная ошибка остаётся в `cause`: показываем человеку понятный текст, но в консоли
    // и в отчёте о сбое должен быть виден статус и код, иначе отладка идёт по пересказу.
    throw new Error(failureText(error), { cause: error })
  }
}
