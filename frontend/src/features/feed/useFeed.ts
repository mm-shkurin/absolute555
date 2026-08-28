// Запрос ленты. Ключ кэша — сам объект фильтров: возврат к прежнему набору показывает
// уже полученное, а не ждёт сервер второй раз.
import { useQuery } from '@tanstack/react-query'
import { fetchFeed } from './api/listingsApi'
import type { FeedQuery } from './logic/feedQuery'
import { toListingView, type ListingView } from './logic/listingView'

export interface FeedResult {
  listings: ListingView[]
  total: number
  isLoading: boolean
  error: Error | null
  retry: () => void
}

export function useFeed(query: FeedQuery): FeedResult {
  const result = useQuery({
    queryKey: ['feed', query],
    queryFn: ({ signal }) => fetchFeed(query, signal),
  })

  return {
    listings: (result.data?.items ?? []).map(toListingView),
    total: result.data?.total ?? 0,
    isLoading: result.isPending,
    error: (result.error as Error | null) ?? null,
    retry: () => void result.refetch(),
  }
}
