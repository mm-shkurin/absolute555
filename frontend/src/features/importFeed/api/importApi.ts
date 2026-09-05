// Направление «под заказ»: позиции поставщиков, сами поставщики и заявки покупателей.
// Три разные сущности в одной ленте, потому что покупателю они отвечают на один вопрос —
// как получить машину, которой в стране ещё нет.
import { fetchFeed } from '../../../shared/api/backend/saleCarApi'
import { fetchSuppliers } from '../../../shared/api/backend/supplierApi'
import type { SupplierProfileWire } from '../../../shared/api/backend/supplierContract'
import { fetchOpenRequests } from '../../../shared/api/backend/requestApi'
import type { BuyerRequestWire } from '../../../shared/api/backend/requestContract'
import { fromFeedCard } from '../../../shared/domain/listing/fromFeedCard'
import type { ListingWire } from '../../../shared/domain/listing/listingWire'

export type ImportKind = 'cars' | 'suppliers' | 'requests'

/** Витрина с провода в то, что рисует карточка.
 *
 *  Рейтинга и числа поставок у профиля нет: сделки поставщика сервер не считает, а
 *  показывать ноль значило бы сказать «ни одной поставки» про того, кто их сделал. */
function toSupplier(wire: SupplierProfileWire): SupplierWire {
  return {
    id: wire.user_id,
    name: wire.company_name ?? 'Без названия',
    rating: null,
    deliveries_count: 0,
    countries: wire.countries,
    brands: wire.brands,
    delivery_days:
      wire.delivery_days_min && wire.delivery_days_max
        ? `${wire.delivery_days_min}–${wire.delivery_days_max} дней`
        : 'срок не указан',
    prepayment_percent: 0,
  }
}

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
  /** Ленту спроса сервер открывает не всем. Пустой список и закрытый раздел — разные
   *  вещи, и экран обязан их различать: иначе покупатель видит ноль заявок там, где их
   *  шестьдесят четыре, и думает, что сломалось. */
  requests_locked: boolean
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
  // Кому лента спроса открыта, решает сервер, а не клиент: раньше здесь стояло
  // сравнение роли с `importer`, и модератор с администратором не спрашивали её вовсе —
  // экран показывал им ноль заявок при шестидесяти четырёх открытых.
  const [cars, requests, suppliers] = await Promise.all([
    fetchFeed({ kind: 'import' }, signal),
    fetchOpenRequests(1, signal).catch(() => null),
    fetchSuppliers(1, signal),
  ])

  return {
    cars: cars.items.map(fromFeedCard),
    cars_total: cars.total,
    requests: requests?.items ?? [],
    requests_total: requests?.total ?? 0,
    // Отказ сервера — это «не для вас», а не сбой: покупателю лента спроса закрыта
    // намеренно, иначе он увидел бы, с кем стоит в очереди.
    requests_locked: requests === null,
    suppliers: suppliers.items.map(toSupplier),
    suppliers_total: suppliers.total,
  }
}
