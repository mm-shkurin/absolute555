// Обмен одноразового кода на пару токенов и начало сессии.
//
// Поток: кнопка уводит всю страницу на серверный `start`, оттуда браузер идёт к провайдеру
// и возвращается на серверный колбэк, а тот присылает нас обратно с `code` в адресе. Токен
// редиректом не едет: он остался бы в истории браузера и в referer следующей страницы.
import { request } from '../../../shared/api/httpClient'
import { BACKEND } from '../../../shared/api/backend/paths'
import { fetchProfile } from '../../../shared/api/backend/accountApi'
import type { TokenWire, UserWire } from '../../../shared/api/backend/accountContract'
import { startSession, type Role } from '../../../shared/session/authSession'

/** Мимо `send`: токена ещё нет, прикладывать к запросу нечего, а истёкшая сессия здесь
 *  не событие — её и не было. */
export function exchangeCode(code: string): Promise<TokenWire> {
  return request<TokenWire>(BACKEND.auth.oauthExchange, { method: 'POST', body: { code } })
}

// Роли сервера и роли экрана совпадают не полностью: `importer` появится вместе с каналом
// «под заказ», а гость на сервере — это учётная запись, тогда как на экране гость означает
// «сессии нет». Незнакомая роль читается как обычный пользователь: скрыть лишнюю кнопку
// безопаснее, чем показать чужую.
const ROLES: Record<string, Role> = {
  user: 'user',
  admin: 'admin',
  manager: 'manager',
  guest: 'user',
}

function displayName(user: UserWire): string {
  const source = user.yandex_json ?? user.vk_json ?? user.tg_json ?? {}
  const found = [source.real_name, source.display_name, source.first_name, source.name].find(
    (value) => typeof value === 'string' && value.trim(),
  )
  return typeof found === 'string' ? found.trim() : ''
}

/** Сессия начинается ДО запроса профиля: профиль требует токена, и без сохранённой пары
 *  запрос ушёл бы без него. Профиль лишь дописывает имя и роль. */
export async function startSessionFrom(tokens: TokenWire): Promise<void> {
  startSession({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    userId: '',
    role: 'user',
    displayName: '',
    avatarUrl: null,
  })

  try {
    const user = await fetchProfile()
    startSession({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      userId: user.id,
      role: ROLES[user.role ?? ''] ?? 'user',
      displayName: displayName(user),
      avatarUrl: null,
    })
  } catch {
    // Профиль не ответил — вход всё равно состоялся. Имя и роль подтянутся при следующем
    // открытии кабинета; выбрасывать человека обратно на вход из-за этого нельзя.
  }
}
