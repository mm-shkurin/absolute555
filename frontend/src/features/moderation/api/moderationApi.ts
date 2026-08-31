// Очередь модерации, жалобы и заявки на роль поставщика. Три раздела одного кабинета, но
// три разные выдачи: модератор работает в одном из них подряд, а не переключается.
import { API } from '../../../shared/api/endpoints'
import { send } from '../../../shared/api/send'
import { fetchPublished } from '../../../shared/api/backend/saleCarApi'
import type { SaleCarWire } from '../../../shared/api/backend/saleCarContract'
import { maskVin } from '../../../shared/domain/listing/vin'

export type QueueTab = 'pending' | 'flagged' | 'done'

export interface QueueItemWire {
  id: string
  listing_id: string
  title: string
  year: number
  price: number
  seller_name: string
  seller_rating: number | null
  seller_is_new: boolean
  submitted_at: string
  photos_count: number
  measured_panels: number
  total_panels: number
  complaints_count: number
  complaint_reason: string | null
  is_import: boolean
  vin_masked: string | null
  photos_plate_hidden: boolean
  phone_hidden: boolean
}

export interface ComplaintWire {
  id: string
  author_name: string
  created_at: string
  reason: string
  body: string
}

export interface ComplaintCaseWire {
  listing_id: string
  title: string
  year: number
  price: number
  seller_name: string
  seller_rating: number | null
  published_at: string
  complaints: ComplaintWire[]
}

export interface RoleApplicationWire {
  id: string
  applicant_name: string
  company_name: string | null
  applied_at: string
  member_since: string
  buyer_rating: number | null
  account_age_days: number
  countries: string[]
  brands: string[]
  delivery_days: string
  prepayment_percent: number
  phone_masked: string
  claimed_deliveries: number | null
  about: string | null
}

function toQueueItem(car: SaleCarWire): QueueItemWire {
  return {
    id: car.sale_car_id,
    listing_id: car.sale_car_id,
    title: `${car.brand ?? car.mark_raw ?? ''} ${car.model ?? car.model_raw ?? ''}`.trim(),
    year: car.year ?? 0,
    price: car.price ?? 0,
    // Продавца сервер в этой выдаче не раскрывает: ни имени, ни рейтинга, ни возраста
    // учётной записи. Модератор видит объявление, а не человека за ним.
    seller_name: '',
    seller_rating: null,
    seller_is_new: false,
    submitted_at: car.updated_at ?? car.created_at ?? '',
    photos_count: car.photos.length,
    measured_panels: 0,
    total_panels: 11,
    complaints_count: 0,
    complaint_reason: null,
    is_import: false,
    vin_masked: maskVin(car.vin),
    photos_plate_hidden: false,
    phone_hidden: false,
  }
}

// Очередь — это объявления в статусе «на модерации». Отдельной выдачи для модератора на
// сервере нет, как нет ни жалоб, ни «сделано за сегодня»: вкладки, кроме первой, пусты.
export async function fetchQueue(
  tab: QueueTab,
  signal?: AbortSignal,
): Promise<{ items: QueueItemWire[]; pending: number; flagged: number; done_today: number }> {
  const cars = tab === 'pending' ? await fetchPublished('moderation', signal) : []
  const items = cars.map(toQueueItem)
  return { items, pending: items.length, flagged: 0, done_today: 0 }
}

export async function fetchComplaints(
  signal?: AbortSignal,
): Promise<{ items: ComplaintCaseWire[]; open: number; resolved: number }> {
  return send(API.moderation.complaints, { signal })
}

export async function fetchRoleApplications(
  signal?: AbortSignal,
): Promise<{ items: RoleApplicationWire[] }> {
  return send(API.moderation.roleApplications, { signal })
}
