// Лента «под заказ». Машины, которых ещё нет в стране: без VIN и без фотографии СТС,
// вместо пробега — срок доставки. Три вида содержимого переключаются на месте, потому что
// покупателю они отвечают на один вопрос.
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { ButtonLink } from '../../shared/ui/Button'
import { ChannelTabs } from '../../shared/ui/ChannelTabs'
import { PanelNote } from '../../shared/ui/Panel'
import { EmptyNotice, FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { ListingGrid } from '../../shared/domain/listing/ListingCard'
import { toListingView } from '../../shared/domain/listing/listingView'
import { ROUTES } from '../../shared/navigation/routes'
import { fetchImportFeed, type ImportKind } from './api/importApi'
import { importCountLine, toRequestCard, toSupplierCard } from './logic/importView'
import { SupplierCard } from './components/SupplierCard'
import { RequestCard } from './components/RequestCard'
import { KindSwitch } from './components/KindSwitch'
import styles from './importFeed.module.css'

export function ImportFeedPage({ signedIn = false }: { signedIn?: boolean }) {
  const [kind, setKind] = useState<ImportKind>('cars')
  const now = new Date()
  const query = useQuery({
    queryKey: ['import-feed'],
    queryFn: ({ signal }) => fetchImportFeed(signal),
  })
  const data = query.data ?? null

  return (
    <>
      <SiteHeader signedIn={signedIn} />
      <main data-testid="import-feed">
        <Container>
          <div className={styles.top}>
            <div className={styles.head}>
              <ChannelTabs current="import" />
              <span className={styles.count}>{data ? importCountLine(data) : 'загружаем…'}</span>
              <span className={styles.spacer} />
              <ButtonLink to={ROUTES.newImportRequest} size="small">
                Оставить заявку
              </ButtonLink>
            </div>

            <KindSwitch current={kind} onSelect={setKind} />

            {kind === 'cars' ? (
              <div className={styles.note}>
                <PanelNote>
                  У машин под привоз нет VIN и фото СТС — их ещё нет в стране. Вместо пробега стоит
                  срок доставки.
                </PanelNote>
              </div>
            ) : null}

            {query.isPending ? <ListSkeleton /> : null}
            {!query.isPending && query.error ? (
              <FailureNotice
                message={(query.error as Error).message}
                onRetry={() => void query.refetch()}
              />
            ) : null}

            {data && kind === 'cars' ? (
              data.cars.length === 0 ? (
                <EmptyNotice title="Позиций под привоз пока нет">
                  Оставьте заявку — поставщики откликнутся сами.
                </EmptyNotice>
              ) : (
                <ListingGrid listings={data.cars.map(toListingView)} />
              )
            ) : null}

            {data && kind !== 'cars' ? (
              <div className={styles.grid}>
                {kind === 'suppliers'
                  ? data.suppliers.map((supplier) => (
                      <SupplierCard key={supplier.id} supplier={toSupplierCard(supplier)} />
                    ))
                  : data.requests.map((request) => (
                      <RequestCard
                        key={request.request_id}
                        request={toRequestCard(request, now)}
                      />
                    ))}
              </div>
            ) : null}
          </div>
        </Container>
      </main>
    </>
  )
}
