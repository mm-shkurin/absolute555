// Мои объявления: черновики, проверка, публикация, отказы и архив в одном списке.
// Вкладки фильтруют уже полученное — состояние объявления меняется редко, а переключение
// вкладок происходит постоянно.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageHeading, PageSection } from '../../shared/ui/PageHeading'
import { PillTabs } from '../../shared/ui/PillTabs'
import { ButtonLink } from '../../shared/ui/Button'
import { EmptyNotice, FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { ROUTES } from '../../shared/navigation/routes'
import { currentRole } from '../../shared/session/authSession'
import { changeStatus } from '../../shared/api/backend/saleCarApi'
import { fetchMyListings, type ListingStatus } from './api/myListingsApi'
import {
  STATUS_TABS,
  countByStatus,
  filterByStatus,
  toMyListingRow,
  type MyListingAction,
} from './logic/myListingRows'
import { MyListingList } from './components/MyListingRow'
import styles from './myListings.module.css'

export function MyListingsPage({ onSignIn }: { onSignIn?: () => void }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<ListingStatus | 'all'>('all')
  const client = useQueryClient()
  const query = useQuery({
    queryKey: ['my-listings'],
    queryFn: ({ signal }) => fetchMyListings(signal),
  })

  // Возврат отклонённого в черновик и снятого в продажу — переходы сервера, а не открытие
  // мастера: из `rejected` отправка запрещена, и правка без этого шага кончилась бы
  // отказом на последнем нажатии.
  const move = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'revise' | 'republish' }) =>
      changeStatus(id, action),
    onSuccess: (_result, { id, action }) => {
      void client.invalidateQueries({ queryKey: ['my-listings'] })
      if (action === 'revise') navigate(ROUTES.sellingDraft(id))
    },
  })

  const items = query.data?.items ?? []
  const rows = filterByStatus(items, tab).map(toMyListingRow)

  const onAction = (action: MyListingAction['id'], row: { id: string }) => {
    if (action === 'offers') navigate(ROUTES.offers)
    else if (action === 'fix') move.mutate({ id: row.id, action: 'revise' })
    else if (action === 'republish') move.mutate({ id: row.id, action: 'republish' })
    // Продолжение открывает ИМЕННО этот черновик, а не новый: мастер без идентификатора
    // завёл бы второе объявление на ту же машину.
    else if (action === 'continue') navigate(ROUTES.sellingDraft(row.id))
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
              action={
                <div className={styles.headActions}>
                  <ButtonLink to={ROUTES.selling}>Разместить автомобиль</ButtonLink>
                  {/* Привоз заводит только поставщик: чужой роли сервер отвечает
                      403 NOT_AN_IMPORTER, и предлагать ей эту кнопку значит обещать
                      отказ. */}
                  {currentRole() === 'importer' ? (
                    <ButtonLink tone="ghost" to={ROUTES.sellingImport} data-testid="sell-import">
                      Разместить под привоз
                    </ButtonLink>
                  ) : null}
                </div>
              }
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
            {move.error ? (
              <FailureNotice
                message={(move.error as Error).message}
                onRetry={() => move.reset()}
              />
            ) : null}
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
