import type { StatusTone } from '../../../shared/ui/StatusBadge'
import type { ListingStatus } from '../api/myListingsApi'

export const LISTING_TONE: Record<ListingStatus, StatusTone> = {
  draft: 'info',
  moderation: 'wait',
  published: 'ok',
  rejected: 'bad',
  withdrawn: 'info',
  sold: 'past',
}

export const LISTING_LABEL: Record<ListingStatus, string> = {
  draft: 'черновик',
  moderation: 'на модерации',
  published: 'опубликовано',
  rejected: 'отклонено',
  withdrawn: 'снято с публикации',
  sold: 'продано',
}

export const STATUS_TABS: { id: ListingStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'draft', label: 'Черновики' },
  { id: 'moderation', label: 'На модерации' },
  { id: 'published', label: 'Опубликованные' },
  { id: 'rejected', label: 'Отклонённые' },
  { id: 'sold', label: 'Проданные' },
]
