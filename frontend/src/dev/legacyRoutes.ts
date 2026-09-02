// Пути, которых на сервере нет: под ними живут экраны, чьи истории ещё не доехали
// (канал «под заказ», заявки поставщикам). Держатся отдельно от настоящих
// адресов, чтобы одно не выглядело как другое.
import { SUPPLIERS } from './fixtures/importing'
import { listingDetail } from './fixtures/detail'
import { FEED, LEXUS } from './fixtures/cars'
import { MY_LISTINGS, PROFILE, offers } from './fixtures/people'
import { CHATS, MESSAGES, SELLER } from './fixtures/rest'
import { COMPLAINTS, QUEUE } from './fixtures/moderation'

function match(path: string, pattern: RegExp): string | null {
  return pattern.exec(path)?.[1] ?? null
}

export function legacyRoute(path: string, query: URLSearchParams): unknown {
  if (path === '/listings') return listingsCollection(query)

  const listingId = match(path, /^\/listings\/([^/]+)$/)
  if (listingId) return listingDetail(listingId, listingId === 'l2')

  if (path === '/offers') return offers(query.get('direction') ?? 'incoming')
  if (path === '/chats') return { items: CHATS }
  if (/^\/chats\/[^/]+\/messages$/.test(path)) return { items: MESSAGES }

  if (path === '/users/me') return PROFILE
  if (/^\/users\/[^/]+\/listings$/.test(path)) return { items: [LEXUS, FEED[1]] }
  if (/^\/users\/[^/]+$/.test(path)) return SELLER

  if (path === '/suppliers') return { items: SUPPLIERS }

  if (path === '/moderation/listings') return queue(query.get('tab') ?? 'pending')
  if (path === '/moderation/complaints')
    return { items: COMPLAINTS, open: COMPLAINTS.length, resolved: 31 }

  return null
}


// Мутации мастера отвечают по-настоящему: черновик без идентификатора и снимок без ответа
// уводят мастер в откат, и сценарий останавливается на первом же шаге.
function listingsCollection(query: URLSearchParams): unknown {
  if (query.get('owner') === 'me') return { items: MY_LISTINGS }
  if (query.get('channel') === 'import') {
    // Машины и заявки приходят настоящими ручками (истории 17 и 18) — здесь остались
    // только поставщики: ленты поставщиков в контракте нет вовсе.
    return {
      cars: [],
      suppliers: SUPPLIERS,
      requests: [],
      cars_total: 0,
      suppliers_total: SUPPLIERS.length,
      requests_total: 0,
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
