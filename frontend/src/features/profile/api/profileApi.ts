// Свой профиль одним запросом: имя с рейтингом, счётчики разделов, состояние заявки на
// роль поставщика и свои заявки на привоз. Всё это шапка личного кабинета, и грузить её
// пятью запросами значит показывать кабинет, собирающийся на глазах.
import { API } from '../../../shared/api/endpoints'
import { send } from '../../../shared/api/send'

export type SupplierApplicationStatus = 'none' | 'pending' | 'approved' | 'rejected'

export interface ImportRequestWire {
  id: string
  title: string
  budget_max: number | null
  created_at: string
  responses_count: number
  active: boolean
}

export interface ProfileWire {
  id: string
  name: string
  rating: number | null
  deals_count: number
  reviews_count: number
  member_since: string
  listings_count: number
  rejected_listings: number
  incoming_offers: number
  outgoing_offers: number
  unread_messages: number
  supplier_status: SupplierApplicationStatus
  supplier_applied_at: string | null
  import_requests: ImportRequestWire[]
}

export async function fetchProfile(signal?: AbortSignal): Promise<ProfileWire> {
  return send<ProfileWire>(API.users.me, { signal })
}
