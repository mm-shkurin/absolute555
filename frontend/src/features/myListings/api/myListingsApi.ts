// Свои объявления во всех состояниях сразу: черновики, модерация, публикация, отказ,
// продажа. Одним запросом — вкладки на экране только фильтруют уже полученное, поэтому
// переключение мгновенное и не гоняет сеть.
import { fetchMyListings as fetchMySaleCars } from '../../../shared/api/backend/saleCarApi'
import type { SaleCarWire } from '../../../shared/api/backend/saleCarContract'

export type ListingStatus =
  | 'draft'
  | 'moderation'
  | 'published'
  | 'rejected'
  | 'withdrawn'
  | 'sold'

export interface MyListingWire {
  id: string
  title: string
  year: number
  price: number | null
  mileage_km: number | null
  status: ListingStatus
  photos_count: number
  measured_panels: number
  total_panels: number
  new_offers: number
  unread_messages: number
  draft_step: number | null
  total_steps: number | null
  updated_at: string
  rejection_reason: string | null
  sold_at: string | null
  sold_price: number | null
  buyer_name: string | null
}

// Снятое живёт на вкладке черновиков — отдельная колонка ради него была бы почти всегда
// пустой, — но состояние своё: из снятого объявление возвращают в продажу одним
// действием, а из черновика ведут по мастеру. Слить их значит предложить не то действие.
const STATUS: Record<SaleCarWire['status'], ListingStatus> = {
  draft: 'draft',
  moderation: 'moderation',
  published: 'published',
  rejected: 'rejected',
  withdrawn: 'withdrawn',
  sold: 'sold',
}

function toMyListing(car: SaleCarWire): MyListingWire {
  return {
    id: car.sale_car_id,
    title: `${car.brand ?? car.mark_raw ?? ''} ${car.model ?? car.model_raw ?? ''}`.trim(),
    year: car.year ?? 0,
    price: car.price,
    mileage_km: car.milleage,
    status: STATUS[car.status],
    photos_count: car.photos.length,
    // Замеров, непрочитанного и шагов черновика сервер не считает: ни карты замеров, ни
    // чатов на нём пока нет, а черновик он не разбивает на шаги.
    measured_panels: 0,
    total_panels: 11,
    new_offers: 0,
    unread_messages: 0,
    draft_step: null,
    total_steps: null,
    updated_at: car.updated_at ?? car.created_at ?? '',
    rejection_reason: car.reject_reason,
    sold_at: car.status === 'sold' ? car.updated_at : null,
    sold_price: car.status === 'sold' ? car.price : null,
    buyer_name: null,
  }
}

export async function fetchMyListings(signal?: AbortSignal): Promise<{ items: MyListingWire[] }> {
  const cars = await fetchMySaleCars(undefined, signal)
  return { items: cars.map(toMyListing) }
}
