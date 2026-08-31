// Дев-заглушка бэкенда: перехватывает fetch и отвечает фикстурами. Включается только
// переменной VITE_MOCK=1 — нужна, чтобы щёлкать по перенесённым экранам, пока настоящие
// ручки не готовы.
//
// Это НЕ контракт. Формы ответов списаны с типов в `features/*/api/*.ts`; когда появится
// настоящий бэкенд, расхождение вылезет здесь же — и папку `src/dev/` можно будет удалить
// целиком, ничего больше не трогая.
import { FEED, IMPORT_CARS, LEXUS } from './fixtures/cars'
import { listingDetail, thicknessMap } from './fixtures/detail'
import { MY_LISTINGS, PROFILE, offers } from './fixtures/people'
import { CHATS, MESSAGES, REVIEW_RIGHT, SELLER, SELLER_REVIEWS } from './fixtures/rest'
import {
  BIDS,
  REQUEST_CARDS,
  SUPPLIERS,
  importRequest,
  supplierProfile,
} from './fixtures/importing'
import { COMPLAINTS, QUEUE, ROLE_APPLICATIONS } from './fixtures/moderation'
import * as wire from './fixtures/wire'
import { currentSession, endSession, startSession } from '../shared/session/authSession'

const LATENCY_MS = 250

export function installMockServer(): void {
  const original = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input.toString(), location.origin)
    if (!url.pathname.startsWith('/api/')) return original(input, init)

    const body = route(url, init?.method ?? 'GET')
    // Задержка намеренная: без неё скелетоны и спиннеры не увидеть ни разу, а они —
    // половина перенесённой работы.
    await new Promise((resolve) => setTimeout(resolve, LATENCY_MS))
    return new Response(JSON.stringify(body ?? {}), {
      status: body === null ? 404 : 200,
      headers: { 'content-type': 'application/json' },
    })
  }
}

function route(url: URL, method: string): unknown {
  const path = url.pathname.replace('/api/v1', '')
  const query = url.searchParams

  if (method !== 'GET') return mutation(path)

  // Настоящие адреса сервера. Экраны, переведённые на них, обслуживаются отсюда;
  // выдуманные пути ниже держатся ради тех экранов, у которых ручек ещё нет.
  if (path === '/sale_car/list') return wire.feedPage(query)
  if (path === '/sale_car/user') return wire.myCars()
  if (path === '/user/profile') return wire.user()
  if (path === '/moderation/queue') return wire.queuePage()
  if (path === '/moderation/counts') return wire.queueCounts()
  if (path === '/moderation/complaints') return wire.complaintPage()
  if (path === '/chat/dialogs') return wire.dialogs()
  if (path === '/chat/unread') return { unread: 3 }
  if (path === '/offer/my') return wire.myOffers()

  const dialogId = match(path, /^\/chat\/dialogs\/([^/]+)\/messages$/)
  if (dialogId) return { items: wire.messages(dialogId), total: 3, page: 1, size: 50 }

  const offersOf = match(path, /^\/offer\/car\/([^/]+)$/)
  if (offersOf) return wire.carOffers(offersOf)

  const saleCarId = match(path, /^\/sale_car\/([^/]+)$/)
  if (saleCarId) return wire.saleCar(saleCarId)

  if (path === '/listings') return listingsCollection(query)
  if (path === '/listings/l-thickness') return null

  const listingId = match(path, /^\/listings\/([^/]+)$/)
  if (listingId) return listingDetail(listingId, listingId === 'l2')

  const thicknessId = match(path, /^\/listings\/([^/]+)\/thickness$/)
  if (thicknessId) return thicknessMap(thicknessId)

  if (path === '/offers') return offers(query.get('direction') ?? 'incoming')
  if (path === '/chats') return { items: CHATS }
  if (/^\/chats\/[^/]+\/messages$/.test(path)) return { items: MESSAGES }

  if (path === '/users/me') return PROFILE
  if (/^\/users\/[^/]+\/listings$/.test(path)) return { items: [LEXUS, FEED[1]] }
  if (/^\/users\/[^/]+\/reviews$/.test(path)) return { items: SELLER_REVIEWS, right: REVIEW_RIGHT }
  if (/^\/users\/[^/]+$/.test(path)) return SELLER

  const supplierId = match(path, /^\/suppliers\/([^/]+)$/)
  if (supplierId) return supplierProfile(supplierId)
  if (path === '/suppliers') return { items: SUPPLIERS }

  const requestId = match(path, /^\/import-requests\/([^/]+)$/)
  if (requestId) return importRequest(requestId)
  if (/^\/import-requests\/[^/]+\/responses$/.test(path)) return { items: BIDS }

  if (path === '/moderation/listings') return queue(query.get('tab') ?? 'pending')
  if (path === '/moderation/complaints')
    return { items: COMPLAINTS, open: COMPLAINTS.length, resolved: 31 }
  if (path === '/moderation/supplier-applications') return { items: ROLE_APPLICATIONS }

  return null
}

// Мутации мастера отвечают по-настоящему: черновик без идентификатора и снимок без ответа
// уводят мастер в откат, и сценарий останавливается на первом же шаге.
function mutation(path: string): unknown {
  if (path === '/sale_car') return wire.saleCar('l1')

  const stsFor = match(path, /^\/sale_car\/([^/]+)\/sts$/)
  if (stsFor) {
    return {
      sale_car_id: stsFor,
      autofill: { state: 'pending', brand_source: null, model_source: null, updated_at: null },
    }
  }

  const patched = match(path, /^\/sale_car\/([^/]+)$/)
  if (patched) return wire.saleCar(patched)

  // Остальные кнопки, дошедшие до сети, не должны падать посреди клика.
  return { ok: true }
}

function listingsCollection(query: URLSearchParams): unknown {
  if (query.get('owner') === 'me') return { items: MY_LISTINGS }
  if (query.get('channel') === 'import') {
    return {
      cars: IMPORT_CARS,
      suppliers: SUPPLIERS,
      requests: REQUEST_CARDS,
      cars_total: IMPORT_CARS.length,
      suppliers_total: SUPPLIERS.length,
      requests_total: REQUEST_CARDS.length,
    }
  }
  const items = filtered(query)
  return { items, total: items.length }
}

// Фильтры работают по-настоящему: иначе пустое состояние ленты — единственное, которое
// нельзя увидеть, а именно оно чаще всего и ломается.
function filtered(query: URLSearchParams): typeof FEED {
  // Имена параметров — те же, что шлёт `feedQuery.toSearchParams`. Разойдутся — заглушка
  // молча вернёт всё, и фильтр будет выглядеть сломанным ровно так же, как сломанный.
  const priceMax = Number(query.get('price_to') ?? '')
  const withMap = query.get('thickness_map') === 'true'
  return FEED.filter((car) => {
    if (Number.isFinite(priceMax) && priceMax > 0 && car.price > priceMax) return false
    if (withMap && !car.has_thickness_map) return false
    return true
  })
}

function queue(tab: string): unknown {
  const items =
    tab === 'flagged'
      ? QUEUE.filter((item) => item.complaints_count > 0)
      : tab === 'done'
        ? []
        : QUEUE
  return {
    items,
    pending: QUEUE.length,
    flagged: QUEUE.filter((item) => item.complaints_count > 0).length,
    done_today: 14,
  }
}

function match(path: string, pattern: RegExp): string | null {
  const found = path.match(pattern)
  return found ? found[1] : null
}

// Демо-сессия: без неё каждый личный экран отвечает «войдите заново», и щёлкать нечего.
// Роль admin — чтобы разделы модерации тоже открывались.
//
// Гостя видно по `?guest=1`: главная у вошедшего — это лента, и лендинг иначе не открыть
// вовсе. Выбор переживает переходы по страницам, вернуться в сессию — `?guest=0`.
const GUEST_KEY = 'absolute.mock.guest'

export function installMockSession(): void {
  const asked = new URLSearchParams(location.search).get('guest')
  if (asked === '1') localStorage.setItem(GUEST_KEY, '1')
  if (asked === '0') localStorage.removeItem(GUEST_KEY)

  if (localStorage.getItem(GUEST_KEY) === '1') {
    endSession()
    return
  }

  if (currentSession()) return
  startSession({
    accessToken: 'mock-access',
    refreshToken: 'mock-refresh',
    userId: 'u1',
    role: 'admin',
    displayName: 'Михаил',
    avatarUrl: null,
  })
}
