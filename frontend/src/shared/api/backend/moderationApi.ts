// Модерация: очередь, счётчики, жалобы и снятие с публикации.
import { send } from '../send'
import { BACKEND } from './paths'
import type {
  ComplaintPageWire,
  ComplaintReason,
  ComplaintWire,
  QueueCountsWire,
  QueuePageWire,
} from './moderationContract'
import type { StatusChangedWire } from './saleCarContract'

interface Page {
  page?: number
  size?: number
}

function paged(path: string, { page, size }: Page): string {
  const params = new URLSearchParams()
  if (page !== undefined) params.set('page', String(page))
  if (size !== undefined) params.set('size', String(size))
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

/** Очередь — объявления, ждущие проверки. Порядок задаёт сервер: модератор разбирает
 *  её подряд, и своя сортировка на клиенте перемешала бы уже разобранное. */
export function fetchQueue(page: Page = {}, signal?: AbortSignal) {
  return send<QueuePageWire>(paged(BACKEND.moderation.queue, page), { signal })
}

/** Счётчики отдельным запросом: они нужны всем трём вкладкам сразу, а выдача — только
 *  открытой. */
export function fetchCounts(signal?: AbortSignal) {
  return send<QueueCountsWire>(BACKEND.moderation.counts, { signal })
}

export function fetchComplaints(page: Page = {}, signal?: AbortSignal) {
  return send<ComplaintPageWire>(paged(BACKEND.moderation.complaints, page), { signal })
}

/** Отклонить жалобу: объявление остаётся, жалоба закрывается. */
export function dismissComplaint(complaintId: string) {
  return send<ComplaintWire>(BACKEND.moderation.dismissComplaint(complaintId), { method: 'POST' })
}

/** Снять с публикации по жалобе — не то же самое, что отклонить черновик: карточка уже
 *  была видна людям, и продавец узнаёт об этом постфактум. */
export function unpublishListing(saleCarId: string) {
  return send<StatusChangedWire>(BACKEND.moderation.unpublish(saleCarId), { method: 'POST' })
}

/** Пожаловаться на объявление. Одна жалоба на человека и объявление — повторную сервер
 *  отвергает, и это не ошибка экрана, а его ответ. */
export function complain(saleCarId: string, reason: ComplaintReason, text?: string) {
  return send<ComplaintWire>(BACKEND.moderation.complain(saleCarId), {
    method: 'POST',
    body: text?.trim() ? { reason, text: text.trim() } : { reason },
  })
}
