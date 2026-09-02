// Свой профиль одним запросом: имя с рейтингом, счётчики разделов, состояние заявки на
// роль поставщика и свои заявки на привоз. Всё это шапка личного кабинета, и грузить её
// пятью запросами значит показывать кабинет, собирающийся на глазах.
import {
  fetchMyRoleRequests,
  fetchProfile as fetchUser,
} from '../../../shared/api/backend/accountApi'
import { fetchMyListings } from '../../../shared/api/backend/saleCarApi'
import { fetchMyRequests } from '../../../shared/api/backend/requestApi'
import { toProfileWire } from '../logic/fromUser'

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

/** Четыре запроса, а не один: сводки кабинета на сервере нет. Число объявлений считается по
 *  собственной выдаче, а состояние заявки на роль — по своим заявкам. */
export async function fetchProfile(signal?: AbortSignal): Promise<ProfileWire> {
  const [user, cars, requests, imports] = await Promise.all([
    fetchUser(signal),
    fetchMyListings(undefined, signal),
    fetchMyRoleRequests(signal),
    fetchMyRequests(signal),
  ])
  const rejected = cars.filter((car) => car.status === 'rejected').length
  return toProfileWire(user, { total: cars.length, rejected }, requests, imports)
}
