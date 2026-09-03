// Запрос ленты. Ключ кэша — сам объект фильтров: возврат к прежнему набору показывает
// уже полученное, а не ждёт сервер второй раз.
//
// Страницы копятся, а не заменяют друг друга: человек листает вниз и сравнивает, и
// подмена показанного новой страницей стоила бы ему уже просмотренного места.
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchFeed, hasMorePages } from './api/listingsApi'
import type { FeedQuery } from './logic/feedQuery'
import { toListingView, type ListingView } from '../../shared/domain/listing/listingView'

export interface FeedResult {
  listings: ListingView[]
  total: number
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  loadMore: () => void
  error: Error | null
  retry: () => void
}

export function useFeed(query: FeedQuery): FeedResult {
  const result = useInfiniteQuery({
    queryKey: ['feed', query],
    queryFn: ({ pageParam, signal }) => fetchFeed(query, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((count, page) => count + page.items.length, 0)
      return hasMorePages(loaded, last.total) ? last.page + 1 : undefined
    },
  })

  const pages = result.data?.pages ?? []
  return {
    listings: pages.flatMap((page) => page.items).map(toListingView),
    total: pages[0]?.total ?? 0,
    isLoading: result.isPending,
    isLoadingMore: result.isFetchingNextPage,
    hasMore: result.hasNextPage,
    loadMore: () => void result.fetchNextPage(),
    error: (result.error as Error | null) ?? null,
    retry: () => void result.refetch(),
  }
}
