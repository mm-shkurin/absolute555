import type { ReactNode } from 'react'
import { PanelNote } from '../../../shared/ui/Panel'
import { EmptyNotice } from '../../../shared/ui/ListStates'
import { ListingGrid } from '../../../shared/domain/listing/ListingCard'
import { toListingView } from '../../../shared/domain/listing/listingView'
import type { ImportFeedWire as ImportFeed, ImportKind } from '../api/importApi'
import { toRequestCard, toSupplierCard } from '../logic/importView'
import { SupplierCard } from './SupplierCard'
import { RequestCard } from './RequestCard'
import styles from '../importFeed.module.css'

interface ImportFeedContentProps {
  kind: ImportKind
  data: ImportFeed | null
  states: ReactNode
}

export function ImportFeedContent({ kind, data, states }: ImportFeedContentProps) {
  return (
    <>
      {kind === 'cars' ? (
        <div className={styles.note}>
          <PanelNote>
            У машин под привоз нет VIN и фото СТС — их ещё нет в стране. Вместо пробега стоит срок
            доставки.
          </PanelNote>
        </div>
      ) : null}
      {states}
      {data && kind === 'cars' ? <CarsSection data={data} /> : null}
      {data && kind === 'requests' ? <RequestsSection data={data} /> : null}
      {data && kind === 'suppliers' ? <SuppliersSection data={data} /> : null}
    </>
  )
}

function CarsSection({ data }: { data: ImportFeed }) {
  if (data.cars.length === 0) {
    return (
      <EmptyNotice title="Позиций под привоз пока нет">
        Оставьте заявку — поставщики откликнутся сами.
      </EmptyNotice>
    )
  }
  return <ListingGrid listings={data.cars.map(toListingView)} />
}

function RequestsSection({ data }: { data: ImportFeed }) {
  const now = new Date()
  if (data.requests_locked) {
    return (
      <EmptyNotice title="Лента заявок открыта поставщикам">
        Здесь покупатели описывают, что нужно привезти, и поставщики отвечают ценой под ключ. Свои
        заявки видно в профиле, а чужие — тем, кто по ним работает: иначе покупатель видел бы, с кем
        он в очереди.
      </EmptyNotice>
    )
  }
  return (
    <>
      {data.requests.length === 0 ? (
        <EmptyNotice title="Заявок пока нет">
          Покупатели ещё ничего не просили привезти.
        </EmptyNotice>
      ) : null}
      <div className={styles.grid}>
        {data.requests.map((request) => (
          <RequestCard key={request.request_id} request={toRequestCard(request, now)} />
        ))}
      </div>
    </>
  )
}

function SuppliersSection({ data }: { data: ImportFeed }) {
  return (
    <>
      {data.suppliers.length === 0 ? (
        <EmptyNotice title="Витрин поставщиков пока не видно">
          Витрина появляется здесь, когда модератор её одобрил. Одобренный поставщик заполняет её в
          своём профиле и отправляет на проверку.
        </EmptyNotice>
      ) : null}
      <div className={styles.grid}>
        {data.suppliers.map((supplier) => (
          <SupplierCard key={supplier.id} supplier={toSupplierCard(supplier)} />
        ))}
      </div>
    </>
  )
}
