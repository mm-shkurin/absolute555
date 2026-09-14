import { Button } from '../../../shared/ui/Button'
import { ListingGrid } from '../../../shared/domain/listing/ListingCard'
import { EmptyFeed, FeedFailure, FeedSkeleton } from './FeedStates'
import type { FeedResult } from '../useFeed'
import styles from '../feed.module.css'

interface FeedResultsProps {
  feed: FeedResult
  filtered: boolean
  onReset: () => void
}

export function FeedResults({ feed, filtered, onReset }: FeedResultsProps) {
  if (feed.isLoading) return <FeedSkeleton />
  if (feed.error) return <FeedFailure message={feed.error.message} onRetry={feed.retry} />
  if (feed.listings.length === 0) return <EmptyFeed filtered={filtered} onReset={onReset} />
  return (
    <>
      <ListingGrid listings={feed.listings} />
      {/* Кнопка, а не бесконечная прокрутка: у ленты есть низ, и человек
          должен до него доходить — иначе он не узнает, что выдача кончилась. */}
      {feed.hasMore ? <MoreButton feed={feed} /> : null}
    </>
  )
}

function MoreButton({ feed }: { feed: FeedResult }) {
  return (
    <div className={styles.more}>
      <Button
        tone="ghost"
        onClick={feed.loadMore}
        disabled={feed.isLoadingMore}
        data-testid="feed-more"
      >
        {feed.isLoadingMore ? 'Загружаем…' : 'Показать ещё'}
      </Button>
    </div>
  )
}
