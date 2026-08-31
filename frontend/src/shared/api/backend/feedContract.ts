// Лента и карточка — контракт истории 7/8, `ProductSpecification/api-specs/sale_car_feed.yaml`.
//
// Бэкенд пишет её сейчас; фронт связан со спекой, а не с тем, что сервер отдаёт сегодня.
// Пока история не доехала, `GET /sale_car/list` возвращает голый массив без страниц —
// лента будет пуста до тех пор.
import type { SaleCarStatus } from './saleCarContract'

export type FeedSort = 'newest' | 'price_asc' | 'price_desc'

/** Ровно то, что нарисовано на карточке списка. Описания, телефона и снимка СТС здесь
 *  нет: лента отдаёт двадцать объявлений за раз, и каждое лишнее поле умножается на
 *  двадцать. */
export interface FeedCardWire {
  sale_car_id: string
  brand: string | null
  model: string | null
  year: number | null
  price: number
  milleage: number | null
  transmission: string | null
  status: SaleCarStatus
  preview_photo_url: string | null
  published_at: string | null
}

export interface FeedPageWire {
  items: FeedCardWire[]
  /** Точное число под текущими фильтрами, а не под текущей страницей: кнопка на экране
   *  обещает конкретное число, и оценка сделала бы это обещание ложным. */
  total: number
  page: number
  size: number
}

/** Модель без марки сервер отвергает: «Focus» есть у трёх производителей, и такой фильтр
 *  значит не то, что показано на экране. Диапазон наоборот — тоже отказ, а не пустота. */
export interface FeedFilters {
  brand_id?: string
  model_id?: string
  year_from?: number
  year_to?: number
  price_from?: number
  price_to?: number
  mileage_from?: number
  mileage_to?: number
  /** Повторяемый параметр: коробка выбирается несколькими значениями сразу. */
  transmission?: string[]
  sort?: FeedSort
  page?: number
  size?: number
}

export interface RevealedPhone {
  phone_number: string
}
