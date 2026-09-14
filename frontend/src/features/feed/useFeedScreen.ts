import { useState } from 'react'
import { countLabel } from '../../shared/domain/listing/listingView'
import { EMPTY_QUERY, type FeedQuery } from './logic/feedQuery'
import { useFeed } from './useFeed'

export function useFeedScreen(initialQuery: FeedQuery) {
  const [query, setQuery] = useState<FeedQuery>(initialQuery)
  const feed = useFeed(query)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [brandOpen, setBrandOpen] = useState(false)
  const reset = () => setQuery({ ...EMPTY_QUERY, tab: query.tab, sort: query.sort })
  return {
    query,
    setQuery,
    feed,
    reset,
    countText: feed.isLoading ? 'ищем…' : countLabel(feed.total),
    filters: { query, total: feed.total, onChange: setQuery, onReset: reset },
    overlays: { brandOpen, sheetOpen, setBrandOpen, setSheetOpen },
  }
}
