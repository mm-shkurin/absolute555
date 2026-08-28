// Мои объявления: черновики, проверка, публикация, отказы и архив в одном списке.
// Вкладки фильтруют уже полученное — состояние объявления меняется редко, а переключение
// вкладок происходит постоянно.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageHeading, PageSection } from '../../shared/ui/PageHeading'
import { PillTabs } from '../../shared/ui/PillTabs'
import { ButtonLink } from '../../shared/ui/Button'
import { EmptyNotice, FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { ROUTES } from '../../shared/navigation/routes'
import { fetchMyListings, type ListingStatus } from './api/myListingsApi'
import {
  STATUS_TABS,
  countByStatus,
  filterByStatus,
  toMyListingRow,
  type MyListingAction,
} from './logic/myListingRows'
import { MyListingList } from './components/MyListingRow'

export function MyListingsPage({ onSignIn }: { onSignIn?: () => void }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<ListingStatus | 'all'>('all')
  const query = useQuery({
    queryKey: ['my-listings'],
    queryFn: ({ signal }) => fetchMyListings(signal),
  })

  const items = query.data?.items ?? []
  const rows = filterByStatus(items, tab).map(toMyListingRow)

  const onAction = (action: MyListingAction['id'], row: { id: string }) => {
    if (action === 'offers') navigate(ROUTES.offers)
    else if (action === 'continue' || action === 'fix') navigate(ROUTES.selling)
    else navigate(ROUTES.listing(row.id))
  }

  return (
    <>
      <SiteHeader signedIn onSignIn={onSignIn} />
      <main data-testid="my-listings-page">
        <Container>
          <PageSection>
            <PageHeading
              title="Мои объявления"
              sub="Черновики, проверка, опубликованные и архив."
              action={<ButtonLink to={ROUTES.selling}>Разместить автомобиль</ButtonLink>}
            />
            <PillTabs
              current={tab}
              onSelect={setTab}
              tabs={STATUS_TABS.map((item) => ({
                id: item.id,
                label: item.label,
                count: countByStatus(items, item.id),
              }))}
            />
            {query.isPending ? <ListSkeleton /> : null}
            {!query.isPending && query.error ? (
              <FailureNotice
                message={(query.error as Error).message}
                onRetry={() => void query.refetch()}
              />
            ) : null}
            {!query.isPending && !query.error && rows.length === 0 ? (
              <EmptyNotice
                title={tab === 'all' ? 'Объявлений пока нет' : 'В этом разделе пусто'}
                action={<ButtonLink to={ROUTES.selling}>Разместить автомобиль</ButtonLink>}
              >
                Объявление создаётся с фотографии СТС — марку, модель и год приложение заполнит
                само.
              </EmptyNotice>
            ) : null}
            {rows.length > 0 ? <MyListingList rows={rows} onAction={onAction} /> : null}
          </PageSection>
        </Container>
      </main>
    </>
  )
}
