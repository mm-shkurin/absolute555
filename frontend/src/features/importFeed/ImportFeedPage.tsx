// Лента «под заказ». Машины, которых ещё нет в стране: без VIN и без фотографии СТС,
// вместо пробега — срок доставки. Три вида содержимого переключаются на месте, потому что
// покупателю они отвечают на один вопрос.
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { ButtonLink } from '../../shared/ui/Button'
import { ChannelTabs } from '../../shared/ui/ChannelTabs'
import { QueryStates } from '../../shared/ui/QueryStates'
import { ROUTES } from '../../shared/navigation/routes'
import { fetchImportFeed, type ImportFeedWire, type ImportKind } from './api/importApi'
import { importCountLine } from './logic/importView'
import { KindSwitch } from './components/KindSwitch'
import { ImportFeedContent } from './components/ImportFeedContent'
import styles from './importFeed.module.css'

export function ImportFeedPage({ signedIn = false }: { signedIn?: boolean }) {
  const [kind, setKind] = useState<ImportKind>('cars')
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
            <ImportFeedHead data={data} />
            <KindSwitch current={kind} onSelect={setKind} />
            <ImportFeedContent
              kind={kind}
              data={data}
              states={<QueryStates query={query} isEmpty={false} />}
            />
          </div>
        </Container>
      </main>
    </>
  )
}

function ImportFeedHead({ data }: { data: ImportFeedWire | null }) {
  return (
    <div className={styles.head}>
      <ChannelTabs current="import" />
      <span className={styles.count}>{data ? importCountLine(data) : 'загружаем…'}</span>
      <span className={styles.spacer} />
      <ButtonLink to={ROUTES.newImportRequest} size="small">
        Оставить заявку
      </ButtonLink>
    </div>
  )
}
