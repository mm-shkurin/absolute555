// Чтение, открытое гостю. Контракт называет такие ручки прямо: у них нет `security` —
// лента, карточка, карта замеров, публичный профиль продавца и витрина поставщика.
//
// Не через `send`, потому что тот на отсутствие сессии отвечает «войдите заново»: для
// личных экранов это верно, а для ленты означало бы, что гость её вовсе не видит — та
// самая молчаливая поломка, ради которой площадка и открыта без входа.
import { request } from './httpClient'
import { authorizedRequest } from '../session/authorizedRequest'
import { currentSession } from '../session/authSession'
import { translatedFailure } from './translateFailure'
import type { RequestOptions } from './httpClient'

export async function sendPublic<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    // Вошедшему запрос идёт с токеном: сервер по нему решает, что показать владельцу —
    // например его собственный черновик по адресу карточки.
    if (currentSession()) return await authorizedRequest<T>(path, options)
    return await request<T>(path, options)
  } catch (error) {
    throw translatedFailure(error)
  }
}
