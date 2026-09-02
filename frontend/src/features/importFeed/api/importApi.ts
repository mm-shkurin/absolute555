// Направление «под заказ»: позиции поставщиков, сами поставщики и заявки покупателей.
// Три разные сущности в одной ленте, потому что покупателю они отвечают на один вопрос —
// как получить машину, которой в стране ещё нет.
import { API } from '../../../shared/api/endpoints'
import { send } from '../../../shared/api/send'
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

/** Заявки покупателей — тоже настоящая ручка (история 18); её читает роль importer,
 *  и постороннему сервер отвечает 403.
 *
 *  Машины под привоз приезжают настоящей лентой — это те же объявления, только другого
 *  канала (история 17). Поставщики и заявки ещё выдуманы: их ручки ждут историй 16 и 18,
 *  и смешивать одно с другим в одном запросе значит потерять, что из этого проверяемо. */
export async function fetchImportFeed(
  kind: ImportKind,
  signal?: AbortSignal,
): Promise<ImportFeedWire> {
  const [invented, cars, requests] = await Promise.all([
    send<ImportFeedWire>(`${API.listings.collection}?channel=import&kind=${kind}`, { signal }),
    fetchFeed({ kind: 'import' }, signal),
    // Ленту спроса читает только поставщик. Остальным она не показывается вовсе — иначе
    // покупатель увидел бы, с кем он в очереди.
    currentRole() === 'importer'
      ? fetchOpenRequests(1, signal)
      : Promise.resolve({ items: [], total: 0, page: 1, size: 0 }),
  ])
  return {
    ...invented,
    cars: cars.items.map(fromFeedCard),
    cars_total: cars.total,
    requests: requests.items,
    requests_total: requests.total,
  }
}
