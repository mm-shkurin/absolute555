// Лента: рабочий экран площадки. Тонкий оркестратор — состояние фильтров держит здесь,
// переходы состояния берёт из `logic/feedQuery`, данные из `useFeed`, рисуют дети.
import { useState } from 'react'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { FeedHead } from './components/FeedHead'
import { FilterPanel } from './components/FilterPanel'
import { MobileFilterBar } from './components/MobileFilterBar'
import { FeedResults } from './components/FeedResults'
import { FeedOverlays } from './components/FeedOverlays'
import { EMPTY_QUERY, isFiltered, type FeedQuery } from './logic/feedQuery'
import { countLabel } from '../../shared/domain/listing/listingView'
import { useFeed } from './useFeed'
import styles from './feed.module.css'

interface FeedPageProps {
  signedIn: boolean
  onSignIn?: () => void
  initialQuery?: FeedQuery
}

export function FeedPage({ signedIn, onSignIn, initialQuery = EMPTY_QUERY }: FeedPageProps) {
  const [query, setQuery] = useState<FeedQuery>(initialQuery)
  const feed = useFeed(query)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [brandOpen, setBrandOpen] = useState(false)
  const reset = () => setQuery({ ...EMPTY_QUERY, tab: query.tab, sort: query.sort })
  const countText = feed.isLoading ? 'ищем…' : countLabel(feed.total)
  const filters = { query, total: feed.total, onChange: setQuery, onReset: reset }
  return (
    <>
      <SiteHeader signedIn={signedIn} onSignIn={onSignIn} />
      <main data-testid="feed">
        <Container className={styles.top}>
          <FeedHead query={query} countText={countText} onChange={setQuery} />
          <MobileFilterBar
            query={query}
            onChange={setQuery}
            onOpenSheet={() => setSheetOpen(true)}
          />
          <div className={styles.grid}>
            <FilterPanel {...filters} onPickBrand={() => setBrandOpen(true)} />
            <div>
              <FeedResults feed={feed} filtered={isFiltered(query)} onReset={reset} />
            </div>
          </div>
        </Container>
      </main>
      <FeedOverlays
        {...filters}
        brandOpen={brandOpen}
        sheetOpen={sheetOpen}
        setBrandOpen={setBrandOpen}
        setSheetOpen={setSheetOpen}
      />
    </>
  )
}
