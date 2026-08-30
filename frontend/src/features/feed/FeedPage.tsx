// Лента: рабочий экран площадки. Тонкий оркестратор — состояние фильтров держит здесь,
// переходы состояния берёт из `logic/feedQuery`, данные из `useFeed`, рисуют дети.
import { useState } from 'react'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { FeedHead } from './components/FeedHead'
import { FilterPanel } from './components/FilterPanel'
import { MobileFilterBar } from './components/MobileFilterBar'
import { ListingGrid } from '../../shared/domain/listing/ListingCard'
import { EmptyFeed, FeedFailure, FeedSkeleton } from './components/FeedStates'
import { EMPTY_QUERY, isFiltered, type FeedQuery } from './logic/feedQuery'
import { countLabel } from '../../shared/domain/listing/listingView'
import { useFeed } from './useFeed'
import styles from './feed.module.css'

export function FeedPage({
  signedIn,
  onSignIn,
  initialQuery = EMPTY_QUERY,
}: {
  signedIn: boolean
  onSignIn?: () => void
  initialQuery?: FeedQuery
}) {
  const [query, setQuery] = useState<FeedQuery>(initialQuery)
  const feed = useFeed(query)
  const reset = () => setQuery({ ...EMPTY_QUERY, tab: query.tab, sort: query.sort })

  return (
    <>
      <SiteHeader signedIn={signedIn} onSignIn={onSignIn} />
      <main data-testid="feed">
        <Container className={styles.top}>
          <FeedHead
            query={query}
            countText={feed.isLoading ? 'ищем…' : countLabel(feed.total)}
            onChange={setQuery}
          />
          <MobileFilterBar query={query} onChange={setQuery} />
          <div className={styles.grid}>
            <FilterPanel
              query={query}
              total={feed.total}
              onChange={setQuery}
              onReset={reset}
              onPickBrand={() => undefined}
            />
            <div>
              {feed.isLoading ? <FeedSkeleton /> : null}
              {!feed.isLoading && feed.error ? (
                <FeedFailure message={feed.error.message} onRetry={feed.retry} />
              ) : null}
              {!feed.isLoading && !feed.error && feed.listings.length === 0 ? (
                <EmptyFeed filtered={isFiltered(query)} onReset={reset} />
              ) : null}
              {!feed.isLoading && !feed.error && feed.listings.length > 0 ? (
                <ListingGrid listings={feed.listings} />
              ) : null}
            </div>
          </div>
        </Container>
      </main>
    </>
  )
}
