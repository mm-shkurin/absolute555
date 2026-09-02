// Дев-заглушка бэкенда: перехватывает fetch и отвечает фикстурами. Включается только
// переменной VITE_MOCK=1 — нужна, чтобы щёлкать по перенесённым экранам, пока настоящие
// ручки не готовы.
//
// Это НЕ контракт. Формы ответов списаны с типов в `features/*/api/*.ts`; когда появится
// настоящий бэкенд, расхождение вылезет здесь же — и папку `src/dev/` можно будет удалить
// целиком, ничего больше не трогая.
import { BRANDS, MODELS } from './fixtures/catalog'
import { SELLER, SELLER_REVIEWS } from './fixtures/rest'
import { MY_ROLE_REQUESTS, ROLE_APPLICATIONS } from './fixtures/moderation'
import { legacyRoute } from './legacyRoutes'
import { eraseMeasurement, thicknessMap, writeMeasurement } from './fixtures/thickness'
import {
  editMyProfile,
  myProfile,
  publicProfile,
  submitMyProfile,
  supplierQueue,
} from './fixtures/supplier'
import type { BodyPanel } from '../shared/api/backend/thicknessContract'
import * as wire from './fixtures/wire'
import * as chatWire from './fixtures/wireChat'
import { mutation } from './fixtures/mutations'
import { currentSession, endSession, startSession } from '../shared/session/authSession'

const LATENCY_MS = 250

export function installMockServer(): void {
  const original = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input.toString(), location.origin)
    if (!url.pathname.startsWith('/api/')) return original(input, init)

    const body = route(url, init?.method ?? 'GET', init?.body)
    // Задержка намеренная: без неё скелетоны и спиннеры не увидеть ни разу, а они —
    // половина перенесённой работы.
    await new Promise((resolve) => setTimeout(resolve, LATENCY_MS))
    return new Response(JSON.stringify(body ?? {}), {
      status: body === null ? 404 : 200,
      headers: { 'content-type': 'application/json' },
    })
  }
}

function route(url: URL, method: string, payload?: BodyInit | null): unknown {
  const path = url.pathname.replace('/api/v1', '')
  const query = url.searchParams

  if (method !== 'GET') return mutate(path, method, payload)

  // Настоящие адреса сервера. Экраны, переведённые на них, обслуживаются отсюда;
  // выдуманные пути ниже держатся ради тех экранов, у которых ручек ещё нет.
  if (path === '/sale_car/list') return wire.feedPage(query)
  if (path === '/sale_car/user') return wire.myCars()
  if (path === '/user/profile') return wire.user()
  if (path === '/catalog/brands') return BRANDS
  const modelsOf = match(path, /^\/catalog\/brands\/([^/]+)\/models$/)
  if (modelsOf) return MODELS(modelsOf)
  if (path === '/moderation/queue') return chatWire.queuePage(query.get('tab') ?? 'waiting')
  if (path === '/moderation/counts') return chatWire.queueCounts()
  if (path === '/moderation/complaints') return chatWire.complaintPage()
  if (path === '/chat/dialogs') return chatWire.dialogs()
  if (path === '/chat/unread') return { unread: 3 }
  // Вкладку фильтрует сервер: заглушка делает то же самое, иначе расхождение параметра
  // и выдачи стало бы невидимым.
  if (path === '/role/role-requests') {
    const status = query.get('status')
    return status ? ROLE_APPLICATIONS.filter((one) => one.status === status) : ROLE_APPLICATIONS
  }
  if (path === '/role/my-role-requests') return MY_ROLE_REQUESTS
  if (path === '/supplier/me') return myProfile()
  if (path === '/moderation/suppliers') return supplierQueue()

  const supplierOf = match(path, /^\/supplier\/([^/]+)$/)
  if (supplierOf) return publicProfile(supplierOf)

  const reviewsOf = match(path, /^\/seller\/([^/]+)\/reviews$/)
  if (reviewsOf)
    return { items: SELLER_REVIEWS, total: SELLER_REVIEWS.length, page: 1, size: 20 }

  const listingsOf = match(path, /^\/seller\/([^/]+)\/listings$/)
  if (listingsOf) {
    const items = wire.feedPage(new URLSearchParams()).items.slice(0, 2)
    return { items, total: items.length, page: 1, size: 20 }
  }

  const sellerId = match(path, /^\/seller\/([^/]+)$/)
  if (sellerId) return { ...SELLER, user_id: sellerId }
  if (path === '/offer/my')
    return query.get('side') === 'received' ? wire.carOffers('l1') : wire.myOffers()

  const dialogId = match(path, /^\/chat\/dialogs\/([^/]+)\/messages$/)
  if (dialogId) return { items: chatWire.messages(dialogId), total: 3, page: 1, size: 50 }

  const offersOf = match(path, /^\/offer\/car\/([^/]+)$/)
  if (offersOf) return wire.carOffers(offersOf)

  const thicknessOf = match(path, /^\/sale_car\/([^/]+)\/thickness$/)
  if (thicknessOf) return thicknessMap(thicknessOf)

  const saleCarId = match(path, /^\/sale_car\/([^/]+)$/)
  if (saleCarId) return wire.saleCar(saleCarId)

  // Экраны, ещё не переведённые на настоящие адреса, обслуживаются отдельно: смешивать
  // выдуманные пути с реальными в одном списке значит потерять, каких из них ждать от
  // сервера, а каких — нет.
  return legacyRoute(path, query)
}

// Замер записывается и снимается по адресу панели, и заглушка отвечает картой, как
// сервер: экран рисует пришедшее, и на общем `{ok:true}` панель осталась бы серой.
function mutate(path: string, method: string, payload?: BodyInit | null): unknown {
  // Профиль поставщика в заглушке живой: правка и отправка меняют то, что экран
  // прочитает следующим запросом, иначе статус разошёлся бы с кнопками.
  if (path === '/supplier/me') return editMyProfile(jsonOf(payload))
  if (path === '/supplier/me/submit') return submitMyProfile()
  const approved = /^\/moderation\/suppliers\/([^/]+)\/approve$/.exec(path)
  if (approved) return { ...publicProfile(approved[1]), status: 'published' }
  const rejected = /^\/moderation\/suppliers\/([^/]+)\/reject$/.exec(path)
  if (rejected) return { ...publicProfile(rejected[1]), status: 'rejected' }

  const panelPath = /^\/sale_car\/([^/]+)\/thickness\/([^/]+)$/.exec(path)
  if (panelPath) {
    const [, saleCarId, panel] = panelPath
    if (method === 'DELETE') eraseMeasurement(saleCarId, panel as BodyPanel)
    else writeMeasurement(saleCarId, panel as BodyPanel, valueOf(payload))
    return thicknessMap(saleCarId)
  }
  return mutation(path)
}

function jsonOf(payload?: BodyInit | null): Record<string, unknown> {
  if (typeof payload !== 'string') return {}
  try {
    return JSON.parse(payload) as Record<string, unknown>
  } catch {
    return {}
  }
}

function valueOf(payload?: BodyInit | null): number {
  const sent = payload instanceof FormData ? payload.get('value_um') : null
  const parsed = Number(sent ?? '')
  // Пустое поле — история 15: число читает сервер. Заглушка читать не умеет и кладёт
  // заведомо заводское значение, чтобы экран не остался без ответа.
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 120
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
