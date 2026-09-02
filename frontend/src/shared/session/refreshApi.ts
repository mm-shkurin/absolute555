// Клиент обновления сессии. Зовёт `httpClient` напрямую, минуя `authorizedRequest`:
// запрос, который получает новый токен, не может ходить через слой, добавляющий старый.
import { postJson } from '../api/httpClient'
import { BACKEND } from '../api/backend/paths'

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

interface TokenPairWire {
  access_token: string
  refresh_token: string
}

export async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  const wire = await postJson<TokenPairWire>(BACKEND.auth.refresh, { refresh_token: refreshToken })
  return fromWire(wire)
}

// Перевод провода в приложение живёт здесь, а не у вызывающего: snake_case — контракт
// сервера, и он не должен расползаться по коду, который про HTTP ничего не знает.
export function fromWire(wire: TokenPairWire): TokenPair {
  return { accessToken: wire.access_token, refreshToken: wire.refresh_token }
}
