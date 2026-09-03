// Чтение, открытое гостю. Контракт называет такие ручки прямо: у них нет `security` —
// лента, карточка, карта замеров, публичный профиль продавца и витрина поставщика.
//
// Отдельно от `send`, потому что тот на отсутствие сессии отвечает «войдите заново»: для
// личных экранов это верно, а для ленты означало бы, что гость её вовсе не видит — та
// самая молчаливая поломка, ради которой площадка и открыта без входа.
import { request } from './httpClient'
import { currentSession } from '../session/authSession'
import { send } from './send'
import { failureText } from './failureText'
import type { RequestOptions } from './httpClient'

export async function sendPublic<T>(path: string, options: RequestOptions = {}): Promise<T> {
  // Вошедшему запрос идёт с токеном: сервер по нему решает, что показать владельцу —
  // например его собственный черновик по адресу карточки.
  if (currentSession()) return send<T>(path, options)
  try {
    return await request<T>(path, options)
  } catch (error) {
    throw new Error(failureText(error), { cause: error })
  }
}
