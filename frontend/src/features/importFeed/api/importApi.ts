// Направление «под заказ»: позиции поставщиков, сами поставщики и заявки покупателей.
// Три разные сущности в одной ленте, потому что покупателю они отвечают на один вопрос —
// как получить машину, которой в стране ещё нет.
import { fetchFeed } from '../../../shared/api/backend/saleCarApi'
import { fetchOpenRequests } from '../../../shared/api/backend/requestApi'
import type { BuyerRequestWire } from '../../../shared/api/backend/requestContract'
import { currentRole } from '../../../shared/session/authSession'
import { fromFeedCard } from '../../../shared/domain/listing/fromFeedCard'
import type { ListingWire } from '../../../shared/domain/listing/listingWire'

export type ImportKind = 'cars' | 'suppliers' | 'requests'

export interface SupplierWire {
  id: string
  name: string
  rating: number | null
  deliveries_count: number
  countries: string[]
  brands: string[]
  delivery_days: string
  prepayment_percent: number
}

export interface ImportFeedWire {
  cars: ListingWire[]
  suppliers: SupplierWire[]
  requests: BuyerRequestWire[]
  cars_total: number
  suppliers_total: number
  requests_total: number
}

/** Лента направления «под заказ» целиком: машины и заявки покупателей.
 *
 *  Машины — та же лента объявлений, только другого канала (история 17). Заявки читает
 *  роль поставщика (история 18), остальным сервер отвечает 403, и вместо отказа они
 *  получают пустой список.
 *
 *  Вкладка выбирается на экране, а не запросом: обе выдачи невелики, приходят разом, и
 *  переключение вкладок не гоняет сеть. */
export async function fetchImportFeed(signal?: AbortSignal): Promise<ImportFeedWire> {
  const [cars, requests] = await Promise.all([
    fetchFeed({ kind: 'import' }, signal),
    // Ленту спроса читает только поставщик. Остальным она не показывается вовсе — иначе
    // покупатель увидел бы, с кем он в очереди.
    currentRole() === 'importer'
      ? fetchOpenRequests(1, signal)
      : Promise.resolve({ items: [], total: 0, page: 1, size: 0 }),
  ])

  return {
    cars: cars.items.map(fromFeedCard),
    cars_total: cars.total,
    requests: requests.items,
    requests_total: requests.total,
    // Витрины одобренных поставщиков сервер списком не отдаёт: есть страница одного
    // (`GET /supplier/{user_id}`) и очередь модератора, а ленты нет. Пустой список
    // честнее выдуманного запроса, который до этой правки уходил на `/api/v1/listings`
    // и получал 404 — Promise.all падал, и раздел «Под заказ» не открывался ни у кого,
    // включая вкладку с машинами, которая работает. Записано в backend-contract-map.md.
    suppliers: [],
    suppliers_total: 0,
  }
}
