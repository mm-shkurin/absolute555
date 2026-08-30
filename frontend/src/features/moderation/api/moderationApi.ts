// Очередь модерации, жалобы и заявки на роль поставщика. Три раздела одного кабинета, но
// три разные выдачи: модератор работает в одном из них подряд, а не переключается.
import { API } from '../../../shared/api/endpoints'
import { send } from '../../../shared/api/send'

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

export async function fetchQueue(
  tab: QueueTab,
  signal?: AbortSignal,
): Promise<{ items: QueueItemWire[]; pending: number; flagged: number; done_today: number }> {
  return send(`${API.moderation.queue}?tab=${tab}`, { signal })
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
