// Очередь модерации, жалобы и заявки на роль поставщика. Три раздела одного кабинета, но
// три разные выдачи: модератор работает в одном из них подряд, а не переключается.

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


import {
  fetchQueue as fetchQueuePage,
  fetchCounts,
  fetchComplaints as fetchComplaintPage,
  dismissComplaint as dismissComplaintCall,
  unpublishListing as unpublishListingCall,
  type QueueTabWire,
} from '../../../shared/api/backend/moderationApi'
import {
  answerRoleRequest,
  fetchRoleRequests,
} from '../../../shared/api/backend/accountApi'
import type { RoleRequestDecision } from '../../../shared/api/backend/accountContract'
import {
  approveListing as approveListingCall,
  rejectListing as rejectListingCall,
} from '../../../shared/api/backend/saleCarApi'
import type {
  ComplaintGroupWire,
  QueueItemWire as WireQueueItem,
  RejectionLabel,
} from '../../../shared/api/backend/moderationContract'
import { complaintReasonText } from '../../../shared/domain/moderationReasons'

// Вкладки экрана и вкладки сервера названы по-разному: экран говорит о работе модератора,
// сервер — о состоянии объявления. Перевод здесь, чтобы имя с провода не расползлось.
const TAB: Record<QueueTab, QueueTabWire> = {
  pending: 'waiting',
  flagged: 'complained',
  done: 'handled_today',
}

function toQueueItem(item: WireQueueItem): QueueItemWire {
  return {
    id: item.sale_car_id,
    listing_id: item.sale_car_id,
    title: `${item.brand ?? ''} ${item.model ?? ''}`.trim(),
    year: item.year ?? 0,
    price: item.price ?? 0,
    seller_name: item.seller?.name ?? '',
    seller_rating: item.seller?.rating ?? null,
    // Новичок — тот, у кого нет ни одной закрытой сделки. Отсутствие оценки этого не
    // говорит: сделка без отзыва оставляет продавца без рейтинга, но не без опыта.
    seller_is_new: (item.seller?.deals_count ?? 0) === 0,
    submitted_at: item.submitted_at ?? '',
    photos_count: item.preview_photo_url ? 1 : 0,
    measured_panels: 0,
    total_panels: 11,
    complaints_count: item.open_complaints,
    complaint_reason: null,
    is_import: false,
    vin_masked: null,
    photos_plate_hidden: false,
    phone_hidden: false,
  }
}

export async function fetchQueue(
  tab: QueueTab,
  signal?: AbortSignal,
): Promise<{ items: QueueItemWire[]; pending: number; flagged: number; done_today: number }> {
  const [page, counts] = await Promise.all([
    fetchQueuePage({ tab: TAB[tab] }, signal),
    fetchCounts(signal),
  ])
  return {
    items: page.items.map(toQueueItem),
    pending: counts.waiting,
    flagged: counts.complained,
    done_today: counts.handled_today,
  }
}

function toComplaintCase(group: ComplaintGroupWire): ComplaintCaseWire {
  const listing = group.listing
  return {
    listing_id: group.sale_car_id,
    title: `${listing?.brand ?? ''} ${listing?.model ?? ''}`.trim(),
    year: listing?.year ?? 0,
    price: listing?.price ?? 0,
    // Продавца в группе жалоб нет: она несёт карточку ленты, а та блока `seller` не
    // содержит. Пустое имя честнее подставленного из соседней выдачи.
    seller_name: '',
    seller_rating: null,
    published_at: listing?.published_at ?? '',
    complaints: group.complaints.map((complaint) => ({
      id: complaint.complaint_id,
      author_name: complaint.author?.name ?? '',
      created_at: complaint.created_at,
      reason: complaintReasonText(complaint.reason),
      body: complaint.text ?? '',
    })),
  }
}

export async function fetchComplaints(
  signal?: AbortSignal,
): Promise<{ items: ComplaintCaseWire[]; open: number; resolved: number }> {
  const page = await fetchComplaintPage({}, signal)
  // Разобранные жалобы сервер в этой выдаче не возвращает: счётчик разобранного живёт
  // в `/moderation/counts` и считает сегодняшний день, а не всё время.
  return { items: page.items.map(toComplaintCase), open: page.total, resolved: 0 }
}

export type RoleTab = 'pending' | 'approved' | 'rejected'

/** Заявки одной вкладки. Фильтрует сервер: клиентский фильтр по всей выдаче показывал бы
 *  число заявок на кнопке и другое число под ней. */
export function fetchRoleApplications(tab: RoleTab, signal?: AbortSignal) {
  return fetchRoleRequests(tab, signal)
}

export function answerRoleApplication(requestId: string, decision: RoleRequestDecision) {
  return answerRoleRequest(requestId, decision)
}

export function approveListing(saleCarId: string) {
  return approveListingCall(saleCarId)
}

export function rejectListing(saleCarId: string, label: RejectionLabel, comment?: string) {
  return rejectListingCall(saleCarId, label, comment)
}

export function dismissComplaint(complaintId: string) {
  return dismissComplaintCall(complaintId)
}

export function unpublishListing(saleCarId: string, label: RejectionLabel, comment?: string) {
  return unpublishListingCall(saleCarId, label, comment)
}
