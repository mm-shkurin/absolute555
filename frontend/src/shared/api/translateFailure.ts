import { isSessionExpired } from '../session/authorizedRequest'
import { isAccessClosed } from '../session/accessClosed'
import { failureText } from './failureText'

export function translatedFailure(error: unknown): unknown {
  // Истёкшая сессия проходит насквозь: у неё свой исход — экран входа, а не плашка
  // с текстом ошибки. Свернуть её в общее сообщение значит показать человеку
  // «что-то пошло не так» вместо кнопки, которая чинит проблему.
  if (isSessionExpired(error)) return error
  // Закрытый доступ тоже проходит насквозь: у него свой экран с причиной, а не
  // плашка «не хватает прав», по которой не понять, что делать.
  if (isAccessClosed(error)) return error
  // Исходная ошибка остаётся в `cause`: показываем человеку понятный текст, но в консоли
  // и в отчёте о сбое должен быть виден статус и код, иначе отладка идёт по пересказу.
  return new Error(failureText(error), { cause: error })
}
