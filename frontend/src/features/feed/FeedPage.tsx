// Лента: рабочий экран площадки. Тонкий оркестратор — состояние фильтров держит
// `useFeedScreen`, переходы состояния — `logic/feedQuery`, рисуют дети.
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { FeedHead } from './components/FeedHead'
import { FilterPanel } from './components/FilterPanel'
import { MobileFilterBar } from './components/MobileFilterBar'
import { FeedResults } from './components/FeedResults'
import { FeedOverlays } from './components/FeedOverlays'
import { EMPTY_QUERY, isFiltered, type FeedQuery } from './logic/feedQuery'
import { useFeedScreen } from './useFeedScreen'
import styles from './feed.module.css'

interface FeedPageProps {
  signedIn: boolean
  onSignIn?: () => void
  initialQuery?: FeedQuery
}

export function FeedPage({ signedIn, onSignIn, initialQuery = EMPTY_QUERY }: FeedPageProps) {
  const { query, setQuery, feed, reset, countText, filters, overlays } = useFeedScreen(initialQuery)
  return (
    <>
      <SiteHeader signedIn={signedIn} onSignIn={onSignIn} />
      <main data-testid="feed">
        <Container className={styles.top}>
          <FeedHead query={query} countText={countText} onChange={setQuery} />
          <MobileFilterBar
            query={query}
            onChange={setQuery}
            onOpenSheet={() => overlays.setSheetOpen(true)}
          />
          <div className={styles.grid}>
            <FilterPanel {...filters} onPickBrand={() => overlays.setBrandOpen(true)} />
            <div>
              <FeedResults feed={feed} filtered={isFiltered(query)} onReset={reset} />
            </div>
          </div>
        </Container>
      </main>
      <FeedOverlays {...filters} {...overlays} />
    </>
  )
}
