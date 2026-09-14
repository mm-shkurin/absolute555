// Мои объявления: черновики, проверка, публикация, отказы и архив в одном списке.
// Вкладки фильтруют уже полученное — состояние объявления меняется редко, а переключение
// вкладок происходит постоянно.
import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageHeading, PageSection } from '../../shared/ui/PageHeading'
import { PillTabs } from '../../shared/ui/PillTabs'
import { ButtonLink } from '../../shared/ui/Button'
import { EmptyNotice } from '../../shared/ui/ListStates'
import { MutationFailure, QueryStates } from '../../shared/ui/QueryStates'
import { ROUTES } from '../../shared/navigation/routes'
import { fetchMyListings, type ListingStatus } from './api/myListingsApi'
import { STATUS_TABS, countByStatus, filterByStatus, toMyListingRow } from './logic/myListingRows'
import { MyListingList } from './components/MyListingRow'
import { MyListingsHeadActions } from './components/MyListingsHeadActions'
import { useMyListingActions } from './useMyListingActions'

type Tab = ListingStatus | 'all'

export function MyListingsPage({ onSignIn }: { onSignIn?: () => void }) {
  const [tab, setTab] = useState<Tab>('all')
  const query = useQuery({
    queryKey: ['my-listings'],
    queryFn: ({ signal }) => fetchMyListings(signal),
  })
  const { move, onAction } = useMyListingActions()
  const items = query.data?.items ?? []
  const rows = filterByStatus(items, tab).map(toMyListingRow)
  const tabs = STATUS_TABS.map((item) => ({
    id: item.id,
    label: item.label,
    count: countByStatus(items, item.id),
  }))

  return (
    <MyListingsFrame onSignIn={onSignIn}>
      <PillTabs current={tab} onSelect={setTab} tabs={tabs} />
      <MutationFailure error={move.error} onReset={move.reset} />
      <QueryStates query={query} isEmpty={rows.length === 0} empty={<EmptyListings tab={tab} />} />
      {rows.length > 0 ? <MyListingList rows={rows} onAction={onAction} /> : null}
    </MyListingsFrame>
  )
}

interface MyListingsFrameProps {
  onSignIn?: () => void
  children: ReactNode
}

function MyListingsFrame({ onSignIn, children }: MyListingsFrameProps) {
  return (
    <>
      <SiteHeader signedIn onSignIn={onSignIn} />
      <main data-testid="my-listings-page">
        <Container>
          <PageSection>
            <PageHeading
              title="Мои объявления"
              sub="Черновики, проверка, опубликованные и архив."
              action={<MyListingsHeadActions />}
            />
            {children}
          </PageSection>
        </Container>
      </main>
    </>
  )
}

function EmptyListings({ tab }: { tab: Tab }) {
  return (
    <EmptyNotice
      title={tab === 'all' ? 'Объявлений пока нет' : 'В этом разделе пусто'}
      action={<ButtonLink to={ROUTES.selling}>Разместить автомобиль</ButtonLink>}
    >
      Объявление создаётся с фотографии СТС — марку, модель и год приложение заполнит само.
    </EmptyNotice>
  )
}
